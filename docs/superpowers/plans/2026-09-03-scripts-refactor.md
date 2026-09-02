# scripts/ 本地重构实施计划（TS 化 + 本地清理 CLI）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `scripts/` 从 CJS JS 全量迁移为 Bun 直跑的 TypeScript，并新增本地 GitHub 清理 CLI（untagged versions / workflow runs / 按时间删旧 versions / action 版本检查），生成器输出保持逐字节等价。

**Architecture:** 生成器 `gen.ts` + 类型化模板工厂 `workflow.ts`；CLI `cli.ts` 子命令分发，`lib/` 下按职责拆分（octokit 封装 / packages / runs / actions 检查）；纯函数全部配 `bun test` 单测，生成器用「重新生成 + git diff 为空」做字节等价验证。

**Tech Stack:** Bun 1.3.13、TypeScript strict（`@types/bun`）、`@octokit/rest@^22`（自带类型 + `octokit.paginate`）、`yaml`、`klaw-sync`、prettier（沿用）。

**Spec:** `docs/superpowers/specs/2026-09-03-scripts-refactor-design.md`

## Global Constraints

- **字节等价硬约束**（spec §6）：`bun run build` 后 `.github/workflows/` 与 `builds/**` 下各映射 yml 与重构前完全一致。
- **工作区含另一会话未提交的变更**（已删 `delete-*.js`/`flows/delete-*.yaml`/`.github/workflows/delete-*.yaml`，新增 `cleanup-ghcr.yaml`/`cleanup-workflow-runs.yaml`）。**所有 commit 只显式 `git add <具体路径>`，禁止 `git add -A` / `git add .`**，严禁把他人的未提交变更裹进本计划 commit。
- 不碰 `scripts/flows/`、不改 `.github/workflows/` 语义。
- 清理语义与原脚本对齐：untagged = `created_at` 距今 > 14 天；old = 含 tag 且 `Math.round(diffDays) >= 30`（`updated_at`，与原 `delete-old.js` 公式一致）；runs 按 `--older-than` + `--keep`。
- 破坏性操作只在 CLI 显式 `--execute` 时发生；默认 dry-run。
- 新依赖仅：`@octokit/rest@^22.0.1`、devDeps `@types/bun`、`@types/klaw-sync`。移除：`fs-extra`（实际只用到 node:fs 已有能力）、`@octokit/core`、`@types/github-script`、`package-lock.json`。
- 工具链已验证：tsconfig `"types": ["@types/bun"]` + strict + `bunx tsc --noEmit` 通过（bun 1.3.13）。

---

### Task 1: 工程化基座与死代码清理

**Files:**

- Create: `tsconfig.json`
- Modify: `package.json`
- Delete: `scripts/migration-v2.js`, `scripts/tests/`, `package-lock.json`

**Interfaces:**

- Consumes: 无（起点任务）
- Produces: strict TS 编译环境；`@octokit/rest@22` 可 import。后续所有任务的类型检查与依赖基线。

- [ ] **Step 1: 删除死代码与杂物**

```bash
git rm scripts/migration-v2.js
git rm -r scripts/tests
git rm --ignore-unmatch package-lock.json
```

- [ ] **Step 2: 更新 package.json**

```json
{
  "dependencies": {
    "@octokit/rest": "^22.0.1",
    "klaw-sync": "^6.0.0",
    "prettier": "^3.8.3",
    "yaml": "^2.8.3"
  },
  "scripts": {
    "build": "bun run clean && bun scripts/gen-workflows.js && prettier --write .",
    "clean": "rm -f .github/workflows/*.yml",
    "cli": "bun scripts/cli.ts"
  },
  "devDependencies": {
    "@types/bun": "^1.0.0",
    "@types/klaw-sync": "^6.0.0"
  }
}
```

注意：`build` 暂仍指向 `gen-workflows.js`（Task 3 才切换）；`@types/github-script` 与 `fs-extra`、`@octokit/core` 已移除。

- [ ] **Step 3: 安装依赖并验证锁文件唯一**

```bash
bun install
ls bun.lockb package-lock.json 2>&1 | true
```

Expected: 依赖安装成功；仅剩 `bun.lockb`。

- [ ] **Step 4: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "types": ["@types/bun"]
  },
  "include": ["scripts/**/*.ts"]
}
```

- [ ] **Step 5: 类型检查通过（当前无 TS 文件，应零错误）**

Run: `bunx tsc --noEmit`
Expected: 无输出，退出码 0。

- [ ] **Step 6: Commit**

```bash
git add tsconfig.json package.json bun.lockb
git commit -m "chore: 引入 TS 基座（strict tsc + @octokit/rest），清理死代码与双锁文件"
```

---

### Task 2: workflow.ts 类型化模板工厂（TDD）

**Files:**

- Create: `scripts/workflow.ts`, `scripts/workflow.test.ts`

**Interfaces:**

- Consumes: 无
- Produces（Task 3 依赖，签名精确如下）:

```ts
export interface Step {
  name?: string;
  uses?: string;
  run?: string;
  with?: Record<string, unknown>;
}
export interface Job {
  "runs-on": string;
  needs?: string[];
  steps: Step[];
}
export interface WorkflowMain {
  name: string;
  on: {
    push: { paths: string[] };
    schedule: { cron: string }[];
    workflow_dispatch: Record<string, never>;
  };
  permissions: { packages: string };
  env: Record<string, string>;
  jobs: Record<string, Job>;
}
export function workflowMain(): WorkflowMain;
export function buildJob(): Job;
export function syncJob(): Job;
```

- [ ] **Step 1: 写失败测试 `scripts/workflow.test.ts`**

```ts
import { describe, test, expect } from "bun:test";
import { workflowMain, buildJob, syncJob } from "./workflow";

describe("workflow 模板工厂", () => {
  test("每次调用返回全新对象，互不影响", () => {
    const a = buildJob();
    const b = buildJob();
    a.steps[a.steps.length - 1].name = "改过的";
    expect(b.steps[b.steps.length - 1].name).toBe("构建 镜像");
    const m1 = workflowMain();
    const m2 = workflowMain();
    m1.on.push.paths.push("x");
    expect(m2.on.push.paths).toHaveLength(0);
  });

  test("workflowMain 骨架字段与原模板一致", () => {
    const m = workflowMain();
    expect(m.name).toBe("构建镜像");
    expect(m.permissions).toEqual({ packages: "write" });
    expect(m.env.GHCR_PASSWORD).toBe("${{ secrets.GITHUB_TOKEN }}");
    expect(m.env.TKE_USERNAME).toBe("${{ secrets.TKE_USERNAME }}");
    // 注释掉的 ACR 凭据不得出现
    expect(Object.keys(m.env).some((k) => k.startsWith("ACR"))).toBe(false);
    expect(m.on.schedule).toEqual([{ cron: "0 14 * * 1" }]);
    expect(m.on.workflow_dispatch).toEqual({});
  });

  test("buildJob / syncJob 结构与原模板一致", () => {
    const bj = buildJob();
    expect(bj["runs-on"]).toBe("ubuntu-latest");
    const push = bj.steps.find((s) =>
      s.uses?.includes("docker/build-push-action"),
    )!;
    expect(push.with).toMatchObject({
      push: true,
      outputs: "type=image,push=true,compression=zstd,compression-level=3",
    });
    const sj = syncJob();
    expect(sj.needs).toEqual([]);
    expect(sj.steps[sj.steps.length - 1].uses).toBeUndefined();
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `bun test scripts/workflow.test.ts`
Expected: FAIL（`./workflow` 不存在）。

- [ ] **Step 3: 实现 `scripts/workflow.ts`**

以现有 `scripts/workflow.js` 的三个对象为唯一事实来源，逐字段等价改写为工厂函数（每次调用返回字面量新对象）；**丢弃全部注释掉的 ACR/HUB 调试行**：

```ts
export interface Step {
  name?: string;
  uses?: string;
  run?: string;
  with?: Record<string, unknown>;
}
export interface Job {
  "runs-on": string;
  needs?: string[];
  steps: Step[];
}
export interface WorkflowMain {
  name: string;
  on: {
    push: { paths: string[] };
    schedule: { cron: string }[];
    workflow_dispatch: Record<string, never>;
  };
  permissions: { packages: string };
  env: Record<string, string>;
  jobs: Record<string, Job>;
}

export function workflowMain(): WorkflowMain {
  return {
    name: "构建镜像",
    on: {
      push: { paths: [] },
      schedule: [{ cron: "0 14 * * 1" }],
      workflow_dispatch: {},
    },
    permissions: { packages: "write" },
    env: {
      TKE_USERNAME: "${{ secrets.TKE_USERNAME }}",
      TKE_PASSWORD: "${{ secrets.TKE_PASSWORD }}",
      HUB_USERNAME: "${{ secrets.HUB_USERNAME }}",
      HUB_PASSWORD: "${{ secrets.HUB_PASSWORD }}",
      GHCR_USERNAME: "${{ github.actor }}",
      GHCR_PASSWORD: "${{ secrets.GITHUB_TOKEN }}",
    },
    jobs: {},
  };
}

export function buildJob(): Job {
  return {
    "runs-on": "ubuntu-latest",
    steps: [
      { name: "检出代码", uses: "actions/checkout@v7" },
      { name: "设置 QEMU", uses: "docker/setup-qemu-action@v4" },
      { name: "设定 Docker Buildx", uses: "docker/setup-buildx-action@v4" },
      {
        name: "登陆到 DockerHub",
        uses: "docker/login-action@v4",
        with: {
          registry: "ghcr.io",
          username: "${{ github.actor }}",
          password: "${{ secrets.GITHUB_TOKEN }}",
        },
      },
      {
        name: "构建 镜像",
        uses: "docker/build-push-action@v7",
        with: {
          context: "",
          file: "",
          push: true,
          tags: "",
          outputs: "type=image,push=true,compression=zstd,compression-level=3",
          "cache-from": "type=gha",
          "cache-to": "type=gha,mode=max",
        },
      },
    ],
  };
}

export function syncJob(): Job {
  return {
    "runs-on": "ubuntu-latest",
    needs: [],
    steps: [
      { name: "检出代码", uses: "actions/checkout@v7" },
      { name: "准备同步工具", run: "bash ./sync-tool/tools.sh" },
      {
        name: "搬回国内",
        run: "./image-syncer -r 5 --proc 16 --auth ./sync-tool/auth.json --images ${syncConfigFile}",
      },
    ],
  };
}
```

- [ ] **Step 4: 测试通过 + 类型检查**

Run: `bun test scripts/workflow.test.ts && bunx tsc --noEmit`
Expected: PASS，tsc 零错误。

- [ ] **Step 5: Commit**

```bash
git add scripts/workflow.ts scripts/workflow.test.ts
git commit -m "refactor: workflow.js 模板改写为类型化工厂函数"
```

---

### Task 3: gen.ts 生成器移植 + 字节等价验证

**Files:**

- Create: `scripts/gen.ts`, `scripts/lib/types.ts`, `scripts/gen.test.ts`
- Modify: `package.json`（`build` 脚本指向 `gen.ts`）
- Delete: `scripts/gen-workflows.js`, `scripts/workflow.js`

**Interfaces:**

- Consumes: Task 2 的 `workflowMain()/buildJob()/syncJob()`
- Produces（后续任务可复用的类型，写在 `scripts/lib/types.ts`）:

```ts
export interface ScanConfig {
  path: string;
  registry: string;
  mirror: string;
  schedule: { cron: string }[];
  extraScanFiles: string[];
}
export interface GenConfig {
  paths: ScanConfig[];
}
export interface WorkflowConfig {
  pushTarget: string;
  context: string;
  dockerfilePath: string;
  workflowName: string;
  workflowFileName: string;
  buildJobName: string;
  syncConfigFile: string;
  schedule: { cron: string }[];
  entrypointPath: string;
  extraConfigPath: string;
}
```

- [ ] **Step 1: 写失败测试 `scripts/gen.test.ts`**

```ts
import { describe, test, expect } from "bun:test";
import { genWorkflowMain, genSyncConfig, buildWorkflowConfig } from "./gen";
import type { ScanConfig } from "./lib/types";

const scan: ScanConfig = {
  path: "builds/stack",
  registry: "ghcr.io/kitkat-starter/stack",
  mirror: "ccr.ccs.tencentyun.com/karasu/stck",
  schedule: [{ cron: "30 5 * * 5" }],
  extraScanFiles: ["php-fpm/scripts/*"],
};

describe("gen 纯函数", () => {
  test("genSyncConfig 生成 registry:tag -> mirror:tag 映射", () => {
    expect(genSyncConfig(scan, "1.0")).toEqual({
      "ghcr.io/kitkat-starter/stack:1.0":
        "ccr.ccs.tencentyun.com/karasu/stck:1.0",
    });
  });

  test("buildWorkflowConfig: Dockerfile 用目录名做 tag", () => {
    const wc = buildWorkflowConfig(
      scan,
      "/abs/repo/builds/stack/php-fpm/Dockerfile",
      "/abs/repo",
    );
    expect(wc.tag).toBe("php-fpm");
    expect(wc.cfg.context).toBe("builds/stack/php-fpm");
    expect(wc.cfg.workflowFileName).toBe(
      ".github/workflows/builds-stack-php-fpm.yml",
    );
    expect(wc.cfg.buildJobName).toBe("build-builds-stack-php-fpm");
    expect(wc.cfg.syncConfigFile).toBe("builds/stack/php-fpm/php-fpm.yml");
  });

  test("buildWorkflowConfig: Dockerfile-<tag> 用后缀做 tag", () => {
    const wc = buildWorkflowConfig(
      scan,
      "/abs/repo/builds/stack/java/Dockerfile-21",
      "/abs/repo",
    );
    expect(wc.tag).toBe("21");
    expect(wc.cfg.workflowFileName).toBe(
      ".github/workflows/builds-stack-java-21.yml",
    );
  });

  test("genWorkflowMain: paths 含 context，extraScanFiles 命中 context 时追加", () => {
    const { cfg } = buildWorkflowConfig(
      scan,
      "/abs/repo/builds/stack/php-fpm/Dockerfile",
      "/abs/repo",
    );
    const main = genWorkflowMain(scan, cfg);
    expect(main.name).toBe("构建 builds-stack-php-fpm-php-fpm 镜像");
    expect(main.on.push.paths).toContain("builds/stack/php-fpm/Dockerfile");
    expect(main.on.push.paths).toContain("builds/stack/php-fpm/scripts/*");
    expect(main.on.schedule).toEqual(scan.schedule);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `bun test scripts/gen.test.ts`
Expected: FAIL（`./gen` 不存在）。

- [ ] **Step 3: 实现 `scripts/lib/types.ts`（上面的 Interfaces 代码原样落地）与 `scripts/gen.ts`**

`gen.ts` 逐段等价移植 `gen-workflows.js`，规则：**输出文件内容相关的逻辑一字不差**；仅删除注释掉的调试代码与逐条 debug `console.log`（保留「工作流名称：」「拷贝 x」两处进度日志）；`fs-extra` 换成 `node:fs` 具名导入：

```ts
import {
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
  copyFileSync,
} from "node:fs";
import klawSync from "klaw-sync";
import path from "node:path";
import YAML from "yaml";
import {
  workflowMain,
  buildJob,
  syncJob,
  type WorkflowMain,
  type Job,
} from "./workflow";
import type { GenConfig, ScanConfig, WorkflowConfig } from "./lib/types";

// 扫描结果中间结构：cfg 为生成参数，tag 单独返回
export function buildWorkflowConfig(
  scan: ScanConfig,
  filePath: string,
  cwd: string,
): { tag: string; cfg: WorkflowConfig } {
  const filename = filePath.split(path.sep).pop()!;
  const tag =
    filename === "Dockerfile"
      ? path.dirname(filePath).split(path.sep).pop()!
      : filename.replace("Dockerfile-", "");
  const regExp = new RegExp(path.sep, "g");
  const taskId = scan.path.replace(regExp, "-");
  const context = path.dirname(filePath).replace(cwd + "/", "");
  const cfg: WorkflowConfig = {
    pushTarget: `${scan.registry}:${tag}`,
    context,
    dockerfilePath: `${context}${path.sep}${filename}`,
    workflowName: `构建 ${taskId}-${tag} 镜像`,
    workflowFileName: `.github/workflows/${taskId}-${tag}.yml`,
    buildJobName: `build-${taskId}-${tag}`,
    syncConfigFile: `${context}/${tag}.yml`,
    schedule: scan.schedule,
    entrypointPath: `${context}${path.sep}entrypoint.sh`,
    extraConfigPath: `${context}/config.yml`,
  };
  return { tag, cfg };
}

export function genWorkflowMain(
  scan: ScanConfig,
  wf: WorkflowConfig,
): WorkflowMain {
  const main = workflowMain();
  main.name = wf.workflowName;
  main.on.push.paths = [
    wf.dockerfilePath,
    wf.entrypointPath,
    wf.workflowFileName,
  ];
  main.on.schedule = wf.schedule;
  for (const extraFile of scan.extraScanFiles) {
    const extraWatchFile = `${scan.path}${path.sep}${extraFile}`;
    if (extraWatchFile.includes(wf.context))
      main.on.push.paths.push(extraWatchFile);
  }
  return main;
}

function genBuildJob(wf: WorkflowConfig): Job {
  const job = buildJob();
  for (const step of job.steps) {
    if (step.uses?.includes("docker/build-push-action")) {
      const withMap = step.with!;
      withMap.context = wf.context;
      withMap.file = wf.dockerfilePath;
      withMap.tags = wf.pushTarget;
      step.name = wf.workflowName;
      if (existsSync(wf.extraConfigPath)) {
        const extraConfig = YAML.parse(
          readFileSync(wf.extraConfigPath).toString(),
        ) as Record<string, unknown>;
        for (const key of Object.keys(extraConfig))
          withMap[key] = extraConfig[key];
      }
    }
  }
  return job;
}

function genSyncJob(wf: WorkflowConfig): Job {
  const job = syncJob();
  job.needs = [wf.buildJobName];
  job.steps[job.steps.length - 1].run =
    `./image-syncer -r 5 --proc 16 --auth ./sync-tool/auth.json --images ${wf.syncConfigFile}`;
  return job;
}

export function genSyncConfig(
  scan: ScanConfig,
  tag: string,
): Record<string, string> {
  return { [`${scan.registry}:${tag}`]: `${scan.mirror}:${tag}` };
}

// ---- 主流程 ----
const cwd = process.cwd();
const config = JSON.parse(
  readFileSync(path.join(import.meta.dir, "config.json")).toString(),
) as GenConfig;
for (const scan of config.paths) {
  const files = klawSync(path.join(cwd, scan.path), { nodir: false });
  for (const file of files) {
    if (file.path.includes("archive")) continue;
    const filename = file.path.split(path.sep).pop()!;
    if (!filename.startsWith("Dockerfile")) continue;
    const { tag, cfg } = buildWorkflowConfig(scan, file.path, cwd);
    console.log(`工作流名称: ${cfg.workflowName}`);
    const main = genWorkflowMain(scan, cfg);
    main.jobs[cfg.buildJobName] = genBuildJob(cfg);
    main.jobs["sync-back"] = genSyncJob(cfg);
    writeFileSync(cfg.workflowFileName, YAML.stringify(main));
    writeFileSync(cfg.syncConfigFile, YAML.stringify(genSyncConfig(scan, tag)));
  }
}

const flowsPath = path.join(import.meta.dir, "flows");
for (const file of readdirSync(flowsPath)) {
  console.log(`拷贝 ${file} 到 .github/workflows`);
  copyFileSync(`${flowsPath}/${file}`, `.github/workflows/${file}`);
}
```

等价性要点（必须逐一核对原 `gen-workflows.js`）：

1. `buildWorkflowConfig` 中 `context` 用 `cwd + "/"` 前缀剥离——与原第 137 行一致（POSIX 路径）。
2. `taskId` 用 `scan.path`（非绝对路径）替换 `path.sep`——与原第 135 行一致。
3. `klawSync(path.join(cwd, scan.path), { nodir: false })`、archive 跳过、`startsWith("Dockerfile")` 判定顺序一致。
4. `genSyncJob` 的 run 字符串与原第 80 行逐字符一致。
5. `genWorkflowMain` 的 paths 顺序：dockerfilePath, entrypointPath, workflowFileName, 然后追加 extraScanFiles——与原第 13-33 行一致。
6. `import.meta.dir` 等价于 `path.dirname(__filename)`（定位 config.json / flows）。

- [ ] **Step 4: 测试通过**

Run: `bun test scripts/gen.test.ts && bunx tsc --noEmit`
Expected: PASS，tsc 零错误。

- [ ] **Step 5: 切换 build 脚本并做字节等价验证**

`package.json` 的 `build` 改为：

```json
"build": "bun run clean && bun scripts/gen.ts && prettier --write ."
```

然后（工作区已含另一会话的 flows 变更，diff 范围只看生成物）：

```bash
bun run build
git diff --exit-code -- .github/workflows builds
git status --short
```

Expected: `git diff` 退出码 0（无任何差异）；`git status --short` 仅显示另一会话已有的未提交项（`D` delete-_ 与 `??` cleanup-_），**不得出现任何 M（修改）**。
若出现 M：逐文件 `git diff <file>` 审查，是等价改写差异（如 YAML 引号风格）则修 gen.ts 直至为空；是语义差异立即停下上报。

- [ ] **Step 6: 删除旧 JS 并 Commit**

```bash
git rm scripts/gen-workflows.js scripts/workflow.js
git add scripts/gen.ts scripts/gen.test.ts scripts/lib/types.ts package.json
git commit -m "refactor: 生成器移植为 gen.ts，输出与原实现字节等价"
```

---

### Task 4: lib/gh.ts — octokit 封装（TDD）

**Files:**

- Create: `scripts/lib/gh.ts`, `scripts/lib/gh.test.ts`
- Modify: `scripts/lib/types.ts`（追加共享类型）

**Interfaces:**

- Consumes: `@octokit/rest` 的 `Octokit`
- Produces:

```ts
export interface RepoRef {
  owner: string;
  repo: string;
}
// url -> {owner, repo}；支持 https://github.com/o/r(.git) 与 git@github.com:o/r(.git)，不匹配返回 null
export function parseRemoteUrl(url: string): RepoRef | null;
// token 解析：GITHUB_TOKEN 优先，其次 ghTokenFn()（生产实现为 `gh auth token`），都无返回 null
export function resolveToken(
  env: Record<string, string | undefined>,
  ghTokenFn: () => string | null,
): string | null;
export function createOctokit(token: string): Octokit;
// --repo 优先，否则读 git remote.origin.url（Bun.$ 实现，可被测试注入）
export async function currentRepo(
  preferred: string | undefined,
  gitRemoteFn?: () => Promise<string>,
): Promise<RepoRef>;
```

- [ ] **Step 1: 写失败测试 `scripts/lib/gh.test.ts`**

```ts
import { describe, test, expect } from "bun:test";
import { parseRemoteUrl, resolveToken } from "./gh";

describe("parseRemoteUrl", () => {
  test.each([
    ["https://github.com/foo/bar.git", { owner: "foo", repo: "bar" }],
    ["https://github.com/foo/bar", { owner: "foo", repo: "bar" }],
    ["git@github.com:foo/bar.git", { owner: "foo", repo: "bar" }],
    ["ssh://git@github.com/foo/bar.git", { owner: "foo", repo: "bar" }],
  ])("%s", (url, expected) => expect(parseRemoteUrl(url)).toEqual(expected));
  test("非 GitHub 地址返回 null", () => {
    expect(parseRemoteUrl("https://gitlab.com/foo/bar.git")).toBeNull();
  });
});

describe("resolveToken", () => {
  test("GITHUB_TOKEN 优先", () => {
    expect(resolveToken({ GITHUB_TOKEN: "env" }, () => "gh")).toBe("env");
  });
  test("回退 gh auth token", () => {
    expect(resolveToken({}, () => "gh")).toBe("gh");
  });
  test("都没有返回 null", () => {
    expect(resolveToken({}, () => null)).toBeNull();
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `bun test scripts/lib/gh.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现 `scripts/lib/gh.ts`**

```ts
import { Octokit } from "@octokit/rest";

export interface RepoRef {
  owner: string;
  repo: string;
}

export function parseRemoteUrl(url: string): RepoRef | null {
  const m = url.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?\/?$/);
  return m ? { owner: m[1], repo: m[2] } : null;
}

export function resolveToken(
  env: Record<string, string | undefined>,
  ghTokenFn: () => string | null,
): string | null {
  return env.GITHUB_TOKEN?.trim() || ghTokenFn();
}

export function ghAuthToken(): string | null {
  try {
    const t = Bun.$`gh auth token`.quiet().text().toString().trim();
    return t || null;
  } catch {
    return null;
  }
}

export function createOctokit(token: string): Octokit {
  return new Octokit({ auth: token });
}

export async function currentRepo(
  preferred: string | undefined,
  gitRemoteFn: () => Promise<string> = async () =>
    (await Bun.$`git config --get remote.origin.url`.quiet().text()).toString(),
): Promise<RepoRef> {
  if (preferred) {
    const [owner, repo] = preferred.split("/");
    if (!owner || !repo)
      throw new Error(`--repo 需要形如 owner/repo，收到: ${preferred}`);
    return { owner, repo };
  }
  const ref = parseRemoteUrl((await gitRemoteFn()).trim());
  if (!ref)
    throw new Error(
      "无法从 git remote.origin.url 解析 owner/repo，请用 --repo owner/repo 指定",
    );
  return ref;
}
```

注意：`Bun.$.quiet().text()` 返回 Promise；生产 `ghAuthToken` 需改为 async 或用 `Bun.spawnSync(["gh", "auth", "token"])` 同步实现——**采用 spawnSync 同步版**以保持 `resolveToken` 注入签名同步：

```ts
export function ghAuthToken(): string | null {
  const p = Bun.spawnSync(["gh", "auth", "token"]);
  const t = p.stdout.toString().trim();
  return p.exitCode === 0 && t ? t : null;
}
```

- [ ] **Step 4: 测试通过 + 类型检查**

Run: `bun test scripts/lib/gh.test.ts && bunx tsc --noEmit`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/gh.ts scripts/lib/gh.test.ts
git commit -m "feat: lib/gh octokit 封装（token 链、repo 解析、类型基座）"
```

---

### Task 5: lib/packages.ts — versions 清理逻辑（TDD）

**Files:**

- Create: `scripts/lib/packages.ts`, `scripts/lib/packages.test.ts`
- Modify: `scripts/lib/types.ts`（追加 ContainerVersion / PlanEntry）

**Interfaces:**

- Consumes: Task 4 的 `Octokit`、`RepoRef`
- Produces:

```ts
// types.ts 追加：
export interface ContainerVersion {
  id: number;
  created_at: string;
  updated_at: string;
  metadata?: { container?: { tags?: string[] | null } | null } | null;
}
export interface PlanEntry {
  pkg: string;
  versionId: number;
  createdAt: string;
  updatedAt: string;
}

// packages.ts：
export const UNTAGGED_DEFAULT_DAYS = 14; // 原 delete-untagged.js 语义
export const OLD_DEFAULT_DAYS = 30; // 原 delete-old.js 语义
// untagged：无 tag 且 created_at 距 now 超过 days
export function buildUntaggedPlan(
  versions: ContainerVersion[],
  pkg: string,
  days: number,
  now: Date,
): PlanEntry[];
// old：含 tag 且 round(距 updated_at 天数) >= days（与原 delete-old.js 公式一致）
export function buildOldPlan(
  versions: ContainerVersion[],
  pkg: string,
  days: number,
  now: Date,
): PlanEntry[];
// 按 package 过滤（CLI --package），空数组/undefined 表示不过滤
export function filterPackages<T extends { pkg: string }>(
  entries: T[],
  wanted?: string,
): T[];
// 列出 owner 名下全部 container 包及其 versions；scope auto：先 org，404 回退 user
export async function listAllContainerVersions(
  octokit: Octokit,
  owner: string,
  scope: "auto" | "org" | "user",
): Promise<{ pkg: string; versions: ContainerVersion[] }[]>;
// 执行删除；scope auto 时沿用 listAllContainerVersions 探测到的实际 scope
export async function deleteVersions(
  octokit: Octokit,
  owner: string,
  scope: "org" | "user",
  entries: PlanEntry[],
): Promise<{
  ok: PlanEntry[];
  failed: { entry: PlanEntry; message: string }[];
}>;
```

- [ ] **Step 1: 写失败测试 `scripts/lib/packages.test.ts`**

```ts
import { describe, test, expect } from "bun:test";
import { buildUntaggedPlan, buildOldPlan, filterPackages } from "./packages";
import type { ContainerVersion } from "./types";

const DAY = 24 * 60 * 60 * 1000;
const now = new Date("2026-09-03T00:00:00Z");
const v = (
  id: number,
  o: Partial<ContainerVersion> = {},
): ContainerVersion => ({
  id,
  created_at: new Date(now.getTime() - 40 * DAY).toISOString(),
  updated_at: new Date(now.getTime() - 40 * DAY).toISOString(),
  metadata: { container: { tags: ["v1"] } },
  ...o,
});

describe("buildUntaggedPlan", () => {
  test("无 tag 且超过 14 天才进计划", () => {
    const versions = [
      v(1, { metadata: { container: { tags: [] } } }), // 40d untagged -> 删
      v(2, {
        metadata: { container: { tags: [] } },
        created_at: new Date(now.getTime() - 5 * DAY).toISOString(),
      }), // 5d untagged -> 留
      v(3), // 40d tagged -> 留
    ];
    const plan = buildUntaggedPlan(versions, "stack", 14, now);
    expect(plan.map((e) => e.versionId)).toEqual([1]);
  });
});

describe("buildOldPlan", () => {
  test("含 tag 且 round 天数 >= 30 进计划（原脚本公式）", () => {
    const versions = [
      v(1), // 40d tagged -> 删
      v(2, { updated_at: new Date(now.getTime() - 29.4 * DAY).toISOString() }), // round=29 -> 留
      v(3, { metadata: { container: { tags: [] } } }), // untagged 不归 old 管 -> 留
    ];
    const plan = buildOldPlan(versions, "stack", 30, now);
    expect(plan.map((e) => e.versionId)).toEqual([1]);
  });
});

describe("filterPackages", () => {
  test("指定 pkg 时过滤，未指定全保留", () => {
    const entries = [{ pkg: "a" }, { pkg: "b" }];
    expect(filterPackages(entries, "b")).toEqual([{ pkg: "b" }]);
    expect(filterPackages(entries)).toEqual(entries);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `bun test scripts/lib/packages.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现 `scripts/lib/packages.ts`**

```ts
import type { Octokit } from "@octokit/rest";
import type { ContainerVersion, PlanEntry } from "./types";

export const UNTAGGED_DEFAULT_DAYS = 14;
export const OLD_DEFAULT_DAYS = 30;

function toEntry(pkg: string, ver: ContainerVersion): PlanEntry {
  return {
    pkg,
    versionId: ver.id,
    createdAt: ver.created_at,
    updatedAt: ver.updated_at,
  };
}

function tags(ver: ContainerVersion): string[] {
  return ver.metadata?.container?.tags ?? [];
}

export function buildUntaggedPlan(
  versions: ContainerVersion[],
  pkg: string,
  days: number,
  now: Date,
): PlanEntry[] {
  const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;
  return versions
    .filter(
      (v) => tags(v).length === 0 && new Date(v.created_at).getTime() < cutoff,
    )
    .map((v) => toEntry(pkg, v));
}

export function buildOldPlan(
  versions: ContainerVersion[],
  pkg: string,
  days: number,
  now: Date,
): PlanEntry[] {
  const nowMs = now.getTime();
  return versions
    .filter((v) => {
      if (tags(v).length === 0) return false;
      const diffDays = Math.round(
        (nowMs - new Date(v.updated_at).getTime()) / (1000 * 60 * 60 * 24),
      );
      return diffDays >= days;
    })
    .map((v) => toEntry(pkg, v));
}

export function filterPackages<T extends { pkg: string }>(
  entries: T[],
  wanted?: string,
): T[] {
  return wanted ? entries.filter((e) => e.pkg === wanted) : entries;
}

type Scope = "org" | "user";

async function detectScope(octokit: Octokit, owner: string): Promise<Scope> {
  try {
    await octokit.rest.packages.listPackagesForOrganization({
      org: owner,
      package_type: "container",
      per_page: 1,
    });
    return "org";
  } catch (e) {
    if ((e as { status?: number }).status === 404) return "user";
    throw e;
  }
}

export async function listAllContainerVersions(
  octokit: Octokit,
  owner: string,
  scope: "auto" | "org" | "user",
): Promise<{ pkg: string; versions: ContainerVersion[] }[]> {
  const real: Scope =
    scope === "auto" ? await detectScope(octokit, owner) : scope;
  const packages =
    real === "org"
      ? await octokit.paginate(
          octokit.rest.packages.listPackagesForOrganization,
          { org: owner, package_type: "container", per_page: 100 },
        )
      : await octokit.paginate(
          octokit.rest.packages.listPackagesForAuthenticatedUser,
          { package_type: "container", per_page: 100 },
        );
  const result: { pkg: string; versions: ContainerVersion[] }[] = [];
  for (const p of packages) {
    const pkg = p.name;
    const versions =
      real === "org"
        ? await octokit.paginate(
            octokit.rest.packages.listPackageVersionsForPackageOwnedByOrg,
            {
              org: owner,
              package_type: "container",
              package_name: pkg,
              per_page: 100,
            },
          )
        : await octokit.paginate(
            octokit.rest.packages
              .listPackageVersionsForPackageOwnedByAuthenticatedUser,
            { package_type: "container", package_name: pkg, per_page: 100 },
          );
    result.push({ pkg, versions: versions as ContainerVersion[] });
  }
  return result;
}

export async function deleteVersions(
  octokit: Octokit,
  owner: string,
  scope: "org" | "user",
  entries: PlanEntry[],
): Promise<{
  ok: PlanEntry[];
  failed: { entry: PlanEntry; message: string }[];
}> {
  const ok: PlanEntry[] = [];
  const failed: { entry: PlanEntry; message: string }[] = [];
  for (const entry of entries) {
    try {
      if (scope === "org") {
        await octokit.rest.packages.deletePackageVersionForOrg({
          org: owner,
          package_type: "container",
          package_name: entry.pkg,
          package_version_id: entry.versionId,
        });
      } else {
        await octokit.rest.packages.deletePackageVersionForAuthenticatedUser({
          package_type: "container",
          package_name: entry.pkg,
          package_version_id: entry.versionId,
        });
      }
      ok.push(entry);
    } catch (e) {
      failed.push({
        entry,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return { ok, failed };
}
```

- [ ] **Step 4: 测试通过 + 类型检查**

Run: `bun test scripts/lib/packages.test.ts && bunx tsc --noEmit`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/packages.ts scripts/lib/packages.test.ts scripts/lib/types.ts
git commit -m "feat: lib/packages 版本清理计划与执行（untagged/old 语义对齐原脚本）"
```

---

### Task 6: lib/runs.ts — workflow runs 清理逻辑（TDD）

**Files:**

- Create: `scripts/lib/runs.ts`, `scripts/lib/runs.test.ts`
- Modify: `scripts/lib/types.ts`（追加 RunInfo）

**Interfaces:**

- Consumes: Task 4 的 `Octokit`、`RepoRef`
- Produces:

```ts
// types.ts 追加：
export interface RunInfo {
  id: number;
  name: string | null;
  createdAt: string;
}

// runs.ts：
// 计划 = created_at 距 now 超过 days 的 runs 中，排除按 created_at 降序保留的最新 keep 条
export function buildRunsPlan(
  runs: RunInfo[],
  days: number,
  keep: number,
  now: Date,
): RunInfo[];
export async function listWorkflowRuns(
  octokit: Octokit,
  repo: RepoRef,
): Promise<RunInfo[]>;
export async function deleteRuns(
  octokit: Octokit,
  repo: RepoRef,
  entries: RunInfo[],
): Promise<{ ok: RunInfo[]; failed: { entry: RunInfo; message: string }[] }>;
```

- [ ] **Step 1: 写失败测试 `scripts/lib/runs.test.ts`**

```ts
import { describe, test, expect } from "bun:test";
import { buildRunsPlan } from "./runs";
import type { RunInfo } from "./types";

const DAY = 24 * 60 * 60 * 1000;
const now = new Date("2026-09-03T00:00:00Z");
const r = (id: number, daysAgo: number): RunInfo => ({
  id,
  name: `run-${id}`,
  createdAt: new Date(now.getTime() - daysAgo * DAY).toISOString(),
});

describe("buildRunsPlan", () => {
  test("只删超过 older-than 的；keep 保留最新 N 条（即使超期）", () => {
    const runs = [r(1, 1), r(2, 10), r(3, 40), r(4, 50)];
    // keep=1 保留 run1；超期且非保留：run3、run4（run2 只有 10 天不超 30）
    expect(buildRunsPlan(runs, 30, 1, now).map((e) => e.id)).toEqual([3, 4]);
  });
  test("keep=0 时全部超期者入选", () => {
    const runs = [r(1, 40), r(2, 50)];
    expect(buildRunsPlan(runs, 30, 0, now).map((e) => e.id)).toEqual([1, 2]);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `bun test scripts/lib/runs.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现 `scripts/lib/runs.ts`**

```ts
import type { Octokit } from "@octokit/rest";
import type { RepoRef, RunInfo } from "./types";

export function buildRunsPlan(
  runs: RunInfo[],
  days: number,
  keep: number,
  now: Date,
): RunInfo[] {
  const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;
  const sorted = [...runs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const protectedIds = new Set(sorted.slice(0, keep).map((r) => r.id));
  return sorted.filter(
    (r) => new Date(r.createdAt).getTime() < cutoff && !protectedIds.has(r.id),
  );
}

export async function listWorkflowRuns(
  octokit: Octokit,
  repo: RepoRef,
): Promise<RunInfo[]> {
  const runs = await octokit.paginate(
    octokit.rest.actions.listWorkflowRunsForRepo,
    {
      owner: repo.owner,
      repo: repo.repo,
      per_page: 100,
    },
  );
  return runs.map((r) => ({
    id: r.id,
    name: r.name ?? null,
    createdAt: r.created_at,
  }));
}

export async function deleteRuns(
  octokit: Octokit,
  repo: RepoRef,
  entries: RunInfo[],
) {
  const ok: RunInfo[] = [];
  const failed: { entry: RunInfo; message: string }[] = [];
  for (const entry of entries) {
    try {
      await octokit.rest.actions.deleteWorkflowRun({
        owner: repo.owner,
        repo: repo.repo,
        run_id: entry.id,
      });
      ok.push(entry);
    } catch (e) {
      failed.push({
        entry,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return { ok, failed };
}
```

- [ ] **Step 4: 测试通过 + 类型检查**

Run: `bun test scripts/lib/runs.test.ts && bunx tsc --noEmit`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/runs.ts scripts/lib/runs.test.ts scripts/lib/types.ts
git commit -m "feat: lib/runs 运行记录清理计划与执行"
```

---

### Task 7: cli.ts 子命令入口（TDD）

**Files:**

- Create: `scripts/cli.ts`, `scripts/cli.test.ts`

**Interfaces:**

- Consumes: Task 4/5/6 的全部导出
- Produces: 可执行 CLI（`bun run cli -- <cmd> [flags]`）；纯函数供测试：

```ts
// 解析 "14d" / "30" 形式为天数；非法抛 Error
export function parseDays(input: string): number;
// 打印计划：分组计数 + 条目行 + dry-run 提示；返回条目总数
export function formatPlan(
  title: string,
  entries: {
    pkg?: string;
    versionId?: number;
    id?: number;
    name?: string | null;
  }[],
): number;
```

- [ ] **Step 1: 写失败测试 `scripts/cli.test.ts`**

```ts
import { describe, test, expect } from "bun:test";
import { parseDays } from "./cli";

describe("parseDays", () => {
  test.each([
    ["14d", 14],
    ["30", 30],
    ["7d", 7],
  ])("%s -> %i", (input, expected) => {
    expect(parseDays(input)).toBe(expected);
  });
  test("非法输入抛错", () => {
    expect(() => parseDays("abc")).toThrow();
    expect(() => parseDays("-5d")).toThrow();
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `bun test scripts/cli.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现 `scripts/cli.ts`**

参数解析用 `node:util` 的 `parseArgs`（bun 内置，零依赖）。子命令：

```ts
import { parseArgs, type ParsedResults } from "node:util";
import {
  resolveToken,
  ghAuthToken,
  createOctokit,
  currentRepo,
  type RepoRef,
} from "./lib/gh";
import {
  listAllContainerVersions,
  buildUntaggedPlan,
  buildOldPlan,
  deleteVersions,
  filterPackages,
  UNTAGGED_DEFAULT_DAYS,
  OLD_DEFAULT_DAYS,
} from "./lib/packages";
import { listWorkflowRuns, buildRunsPlan, deleteRuns } from "./lib/runs";

export function parseDays(input: string): number {
  const m = input.match(/^(\d+)d?$/);
  const n = m ? Number(m[1]) : NaN;
  if (!Number.isInteger(n) || n <= 0)
    throw new Error(`--older-than 需要形如 30 或 30d，收到: ${input}`);
  return n;
}

export function formatPlan(
  title: string,
  entries: {
    pkg?: string;
    versionId?: number;
    id?: number;
    name?: string | null;
  }[],
): number {
  console.log(`\n== ${title}（${entries.length} 项）==`);
  for (const e of entries) {
    const target = e.pkg
      ? `${e.pkg} @ ${e.versionId ?? e.id}`
      : `${e.name ?? "(unnamed)"} #${e.id}`;
    console.log(`  - ${target}  (${e.createdAt ?? ""})`);
  }
  if (entries.length === 0) console.log("  （无待清理项）");
  return entries.length;
}
```

注意：`PlanEntry`/`RunInfo` 都有 `createdAt` 字段，上面 `e.createdAt` 直接可用——把联合类型改为 `Array<PlanEntry | RunInfo>` 并从 `./lib/types` 导入，避免手写重复结构。

主流程骨架（每个清理子命令同构）：

```ts
async function cleanupFlow(
  kind: "untagged" | "old" | "runs",
  argv: string[],
): Promise<number> {
  const parsed = parseArgs({
    args: argv,
    options: {
      execute: { type: "boolean", default: false },
      repo: { type: "string" },
      scope: { type: "string", default: "auto" },
      package: { type: "string" },
      "older-than": {
        type: "string",
        default: kind === "runs" ? "30d" : kind === "old" ? "30d" : "14d",
      },
      keep: { type: "string", default: "0" },
    },
    allowPositionals: false,
  });
  const days = parseDays(parsed.values["older-than"] as string);
  const keep = Number(parsed.values.keep ?? "0");
  const token = resolveToken(process.env, ghAuthToken);
  if (!token) {
    console.error("未找到 token：请设置 GITHUB_TOKEN 或先 `gh auth login`。");
    return 1;
  }
  const octokit = createOctokit(token);
  const repo = await currentRepo(parsed.values.repo as string | undefined);
  const execute = parsed.values.execute === true;
  const wanted = parsed.values.package as string | undefined;

  if (kind === "runs") {
    const runs = await listWorkflowRuns(octokit, repo);
    const plan = buildRunsPlan(runs, days, keep, new Date());
    formatPlan(`workflow runs 清理（> ${days} 天，keep ${keep}）`, plan);
    if (!execute) return hint();
    const { ok, failed } = await deleteRuns(octokit, repo, plan);
    report(ok, failed);
    return failed.length > 0 ? 1 : 0;
  }

  const daysOr = kind === "untagged" ? days : days;
  const all = await listAllContainerVersions(
    octokit,
    repo.owner,
    parsed.values.scope as "auto" | "org" | "user",
  );
  const plan = all
    .filter(({ pkg }) => !wanted || pkg === wanted)
    .flatMap(({ pkg, versions }) =>
      kind === "untagged"
        ? buildUntaggedPlan(versions, pkg, daysOr, new Date())
        : buildOldPlan(versions, pkg, daysOr, new Date()),
    );
  formatPlan(
    `${kind} versions 清理（${kind === "untagged" ? "无 tag 且" : "含 tag 且"} > ${days} 天）`,
    plan,
  );
  if (!execute) return hint();
  // scope 探测：与 listAllContainerVersions 相同的 org→user 回退
  const { ok, failed } = await deleteVersions(
    octokit,
    repo.owner,
    await resolveScope(octokit, repo.owner, parsed.values.scope as string),
    plan,
  );
  report(ok, failed);
  return failed.length > 0 ? 1 : 0;
}

function hint(): number {
  console.log("\n这是 dry-run。确认无误后追加 --execute 真正删除。");
  return 0;
}

function report(
  ok: unknown[],
  failed: { entry: unknown; message: string }[],
): void {
  console.log(`已删除 ${ok.length} 项，失败 ${failed.length} 项`);
  for (const f of failed)
    console.error(`  失败: ${JSON.stringify(f.entry)} -> ${f.message}`);
  if (failed.length > 0) {
    console.error(
      "\n若为 403，多为 token 权限不足：`gh auth refresh -s delete:packages`（runs 需 repo/actions:write）。",
    );
  }
}
```

补充要求（实现时必须落地，不可省）：

1. `resolveScope(octokit, owner, scope)`：`"org" | "user"` 原样返回；`"auto"` 时探测（与 `packages.detectScope` 同逻辑——把 `detectScope` 从 `packages.ts` 导出复用，不要复制实现）。
2. `check-actions` 子命令调用 Task 8 的 `runCheck()`（本任务先留占位 `console.log("check-actions: Task 8 后接入")` 并返回 0，Task 8 替换为真实调用）。
3. 入口分发：

```ts
const [cmd, ...rest] = Bun.argv.slice(2);
const exitCode = await dispatch(cmd, rest);
process.exit(exitCode);
```

`dispatch` 支持：`clean-untagged` / `clean-old` / `clean-runs` / `check-actions` / `--help`（打印用法），未知命令报错返回 2。

- [ ] **Step 4: 测试通过 + 类型检查**

Run: `bun test scripts/cli.test.ts && bunx tsc --noEmit`
Expected: PASS。

- [ ] **Step 5: 真实 dry-run 冒烟（只读，不删任何东西）**

```bash
bun run cli -- clean-untagged
bun run cli -- clean-runs
```

Expected: 正常列出计划或空计划；无 `--execute` 不发生任何删除；token 缺失时给出可读错误。

- [ ] **Step 6: Commit**

```bash
git add scripts/cli.ts scripts/cli.test.ts
git commit -m "feat: 本地清理 CLI（clean-untagged/clean-runs/clean-old，默认 dry-run）"
```

---

### Task 8: check-actions — uses 版本一致性检查（TDD）

**Files:**

- Create: `scripts/lib/actions.ts`, `scripts/lib/actions.test.ts`
- Modify: `scripts/cli.ts`（占位替换为 `runCheck()` 真实调用）

**Interfaces:**

- Consumes: 无外部依赖，纯函数
- Produces:

```ts
// 从单个文件内容提取 uses 引用；形如 uses: "owner/name@version" 或 uses: owner/name@version
export function scanUses(
  content: string,
): { action: string; version: string }[];
// 聚合 + 找漂移：version 多于一个的 action
export function findDrift(
  refs: { action: string; version: string; source: string }[],
): { action: string; versions: { version: string; source: string }[] }[];
// 主入口：扫描 scripts/flows/**、.github/workflows/*.y*ml、scripts/workflow.ts，打印报告；有漂移返回 1
export async function runCheck(): Promise<number>;
```

- [ ] **Step 1: 写失败测试 `scripts/lib/actions.test.ts`**

```ts
import { describe, test, expect } from "bun:test";
import { scanUses, findDrift } from "./actions";

describe("scanUses", () => {
  test("提取 YAML 与 TS 两种写法", () => {
    const content = [
      "      - uses: actions/checkout@v4",
      '      - uses: "docker/setup-buildx-action@v4"',
      "        uses: 'foo/bar@v1.2.3'",
      'uses: "actions/checkout@v7"',
      "run: echo uses: not/a@ref", // run 行里也含 uses: 字样，仍会被匹配——可接受，人工看报告
    ].join("\n");
    const refs = scanUses(content);
    expect(refs).toContainEqual({ action: "actions/checkout", version: "v4" });
    expect(refs).toContainEqual({
      action: "docker/setup-buildx-action",
      version: "v4",
    });
    expect(refs).toContainEqual({ action: "foo/bar", version: "v1.2.3" });
    expect(refs).toContainEqual({ action: "actions/checkout", version: "v7" });
  });
});

describe("findDrift", () => {
  test("同名 action 多版本被报告", () => {
    const refs = [
      { action: "actions/checkout", version: "v4", source: "flows/a.yml" },
      { action: "actions/checkout", version: "v7", source: "gen/workflow.ts" },
      { action: "actions/cache", version: "v4", source: "flows/a.yml" },
    ];
    const drift = findDrift(refs);
    expect(drift).toHaveLength(1);
    expect(drift[0].action).toBe("actions/checkout");
    expect(drift[0].versions.map((v) => v.version).sort()).toEqual([
      "v4",
      "v7",
    ]);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `bun test scripts/lib/actions.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现 `scripts/lib/actions.ts`**

```ts
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export function scanUses(
  content: string,
): { action: string; version: string }[] {
  const out: { action: string; version: string }[] = [];
  const re = /uses:\s*["']?([\w.-]+\/[\w.-]+)@([^\s"'#]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null)
    out.push({ action: m[1], version: m[2] });
  return out;
}

export function findDrift(
  refs: { action: string; version: string; source: string }[],
) {
  const byAction = new Map<string, { version: string; source: string }[]>();
  for (const r of refs) {
    const list = byAction.get(r.action) ?? [];
    list.push({ version: r.version, source: r.source });
    byAction.set(r.action, list);
  }
  return [...byAction.entries()]
    .filter(([, versions]) => new Set(versions.map((v) => v.version)).size > 1)
    .map(([action, versions]) => ({ action, versions }));
}

function collectFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) collectFiles(p, out);
    else out.push(p);
  }
  return out;
}

export async function runCheck(): Promise<number> {
  const cwd = process.cwd();
  const sources: string[] = [
    ...collectFiles(path.join(cwd, "scripts/flows")),
    ...collectFiles(path.join(cwd, ".github/workflows")).filter((f) =>
      /\.ya?ml$/.test(f),
    ),
    path.join(cwd, "scripts/workflow.ts"),
  ];
  const refs: { action: string; version: string; source: string }[] = [];
  for (const file of sources) {
    for (const u of scanUses(readFileSync(file).toString()))
      refs.push({ ...u, source: path.relative(cwd, file) });
  }
  console.log(`扫描 ${sources.length} 个文件，共 ${refs.length} 个 uses 引用`);
  const drift = findDrift(refs);
  if (drift.length === 0) {
    console.log("所有 action 版本一致 ✓");
    return 0;
  }
  for (const d of drift) {
    console.log(`\n漂移: ${d.action}`);
    for (const v of d.versions)
      console.log(`  ${v.version.padEnd(10)} <- ${v.source}`);
  }
  console.log(`\n${drift.length} 个 action 存在版本漂移`);
  return 1;
}
```

- [ ] **Step 4: cli.ts 接入真实 runCheck**

替换 Task 7 的占位：`check-actions` 分支调用 `runCheck()` 并以其返回值作为退出码。

- [ ] **Step 5: 测试通过 + 真实运行验证**

```bash
bun test scripts/lib/actions.test.ts && bunx tsc --noEmit
bun run cli -- check-actions
```

Expected: 单测 PASS；真实运行输出报告（生成模板 `checkout@v7` 等 vs flows 实际版本；若另一会话已统一版本则报告"一致"也算正确——以输出内容人工判断合理性）。

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/actions.ts scripts/lib/actions.test.ts scripts/cli.ts
git commit -m "feat: check-actions 子命令，报告 uses 版本漂移"
```

---

### Task 9: 端到端验证（spec §10 全量）

**Files:**

- 无新文件；只验证与必要的小修

**Interfaces:**

- Consumes: 全部前序任务产物
- Produces: 验证记录（写入 PR/最终汇报）

- [ ] **Step 1: 全量测试与类型检查**

```bash
bun test && bunx tsc --noEmit
```

Expected: 全部 PASS，零类型错误。

- [ ] **Step 2: 字节等价复验**

```bash
bun run build
git diff --exit-code -- .github/workflows builds
```

Expected: 退出码 0。

- [ ] **Step 3: CLI 三命令真实 dry-run（只读）**

```bash
bun run cli -- clean-untagged
bun run cli -- clean-old
bun run cli -- clean-runs
```

Expected: 三者正常输出计划；确认无网络写操作发生（无 --execute）。

- [ ] **Step 4: 汇报验证结果**

向用户汇报：测试数、tsc 结果、字节等价 diff 状态、CLI dry-run 输出摘要、check-actions 报告。

---

## Self-Review 记录

1. **Spec coverage**：§4 技术栈→Task 1；§6 生成器→Task 2/3；§7 CLI→Task 4-8；§8 删除清单→Task 1（本会话批；推迟批已被另一会话完成，工作区待其自行提交）；§9 依赖变更→Task 1（含计划内偏差：顺带移除 `fs-extra`——gen 实际只用 `node:fs` 能力，属 spec §8 清理精神内的合理延伸）；§10 验证→Task 3 Step 5 + Task 9。
2. **Placeholder scan**：Task 7 的 check-actions 占位是显式声明且由 Task 8 替换，非 TBD；其余无。
3. **Type consistency**：`PlanEntry{pkg,versionId,createdAt,updatedAt}`、`RunInfo{id,name,createdAt}`、`ContainerVersion`、`RepoRef` 在各 Task 的 Interfaces 块中一致；`detectScope` 由 Task 5 导出、Task 7 复用；`runCheck()` 由 Task 8 定义、Task 7/8 衔接。
