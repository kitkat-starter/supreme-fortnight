# scripts/ 本地重构设计：TS 化 + 本地清理 CLI

- 日期：2026-09-03
- 状态：设计已批准（含修正：CLI API 客户端采用 `@octokit/rest`）
- 范围说明：CI 侧清理 action 切换在另一会话进行，不在本设计范围内

## 1. 背景

本仓库用 `scripts/gen-workflows.js`（数据驱动 + YAML 库序列化）为 28 个镜像变体生成 GitHub Actions workflow。历史代码无类型、含死代码与调试残留；`delete-*.js` 三个清理脚本将由社区 action 在 CI 侧替代（另一会话处理），本地需要等价的手工清理能力。

## 2. 目标

1. `scripts/` 全量 TypeScript 化（bun 直跑，零构建）。
2. 生成器输出保持**逐字节等价**（硬约束）。
3. 新增本地清理 CLI：untagged versions / workflow runs / 按时间删旧 versions。
4. 新增本地 action 版本一致性检查（`check-actions`）。
5. 清理死代码与杂物（本会话批次）。

## 3. 非目标

- 不改 `.github/workflows/` 生成物语义；不碰 `scripts/flows/`。
- 不做 CI drift 校验（生成是本地操作）。
- 不处理远端 CI 清理 action 切换（另一会话负责）。

## 4. 技术栈

- Bun + TypeScript（strict，零构建，bun 直跑）。
- CLI API 客户端：`@octokit/rest`（用户裁定：本地工具优先类型安全，不介意依赖体积），分页用 `octokit.paginate`。
- 新增 `tsconfig.json`：strict、与 bun 兼容的 module 设置、`noEmit`（类型检查用 `bunx tsc --noEmit`）。

## 5. 目录结构

```
scripts/
  gen.ts            # 生成器（原 gen-workflows.js，逻辑等价改写）
  workflow.ts       # 类型化模板工厂 buildWorkflow(config) 等
  cli.ts            # CLI 入口（子命令分发）
  config.json       # 不变，配 lib/types.ts 的 interface
  lib/
    gh.ts           # octokit 封装：token 解析、repo 解析、分页
    types.ts        # REST 响应类型 + config 类型
  flows/            # 原样不动
```

## 6. 生成器重构

- `gen.ts`：等价改写自 `gen-workflows.js`：klaw-sync 扫描 `builds/**/Dockerfile*`、生成 workflow yml + 同步映射 yml、末尾拷贝 `flows/`。
- `workflow.ts`：三个模板（workflowMain / buildJob / syncJob）改为类型化工厂函数，每次调用构造新对象，消除现存浅拷贝/深拷贝两种风格混用的问题。
- 硬约束：重构后 `bun run gen` 的输出与现有 `.github/workflows/` 及各 `{context}/{tag}.yml` 映射文件逐字节等价。

## 7. CLI 设计

入口 `scripts/cli.ts`，`package.json` 增加 `"cli": "bun scripts/cli.ts"`。

子命令：

| 子命令 | 功能 |
|---|---|
| `clean-untagged [--package <name>]` | 列出/删除 GHCR 无 tag 的 package versions |
| `clean-runs [--older-than 30d] [--keep N]` | 清理 Actions workflow runs |
| `clean-old [--older-than 30d]` | 按时间删除旧 package versions（含仍有 tag 的；语义与原 `delete-old.js` 对齐，时间字段以原脚本为准） |
| `check-actions` | 扫描全仓 yml/ts 中 `uses:` 引用，按 action 聚合报告版本不一致 |

安全模型：

- 默认 **dry-run**：只打印将删除对象的清单与计数；显式 `--execute` 才执行删除（执行时仍打印计数）。
- 认证链：`GITHUB_TOKEN` → `gh auth token`；`--repo <owner/name>` 可覆盖，默认从 git remote 解析。
- GHCR 端点按 owner 归属选择 `/user/packages` 或 `/orgs/{org}/packages`。

## 8. 删除清单

本会话批：

- `scripts/migration-v2.js`（死代码：依赖 `yamljs` 未安装，无法运行）
- `scripts/tests/check-file-or-dir-extsts.js`（假测试草稿）
- `gen-workflows.js` / `workflow.js` 内约 20 行注释掉的调试残留
- `@octokit/core` 依赖（声明但从未 import）
- `package-lock.json`（双锁并存，保留 `bun.lockb`）

待远端适配完成后另行删除（**不在本会话**，整批推迟）：

- `scripts/delete-untagged.js`、`delete-runs.js`、`delete-old.js`
- `scripts/flows/delete-*.yaml` 及生成的 `.github/workflows/delete-*.yml`
- `@types/github-script`

> 推迟原因：`delete-*.js` 被 `flows/delete-*.yaml` 中的 github-script `require`，先删会断链；且 flows 属于远端 CI 侧边界。

## 9. 依赖变更

- `+ @octokit/rest`（dependencies）
- `- @octokit/core`
- 删除 `package-lock.json`，`bun install` 更新 `bun.lockb`
- 无新增类型包（octokit 自带类型）；测试用内置 `bun test`，零依赖

## 10. 验证路径

1. `bunx tsc --noEmit` 通过（strict）。
2. `bun run gen` 后 `git diff` 显示 `.github/workflows/` 与各映射 yml **无差异**（逐字节等价证明；若有 diff 逐条审查确认性质）。
3. `bun test`：对 `gh.ts` 的过滤逻辑与 CLI 计划构建等纯函数写少量单元测试。
4. CLI 实测：对真实 repo 执行 dry-run（只读列出 versions/runs 计划），不执行删除。
5. `check-actions` 应能发现已知漂移（手写 flows `checkout@v4` vs 生成模板 `@v7`），作为真值校验。

## 11. 风险与对策

- 模板工厂化引入输出差异 → 验证 2 兜底，diff 逐条审查。
- token 权限不足（需 `delete:packages`、workflow runs 删除需 `repo`/`actions:write`）→ CLI 给出可读错误与 `gh auth refresh -s delete:packages` 提示。
- 误删风险 → dry-run 默认 + 删除前打印对象计数。
