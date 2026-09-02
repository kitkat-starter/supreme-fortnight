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

/** 由 Dockerfile 路径推导 tag 与全部生成参数（等价于原 gen-workflows.js:115-165） */
export function buildWorkflowConfig(
  scan: ScanConfig,
  filePath: string,
  cwd: string,
): { tag: string; cfg: WorkflowConfig } {
  const filename = filePath.split(path.sep).pop()!;
  // 恰好叫 Dockerfile 时用目录名做 tag，否则用 Dockerfile-<tag> 后缀
  const tag =
    filename === "Dockerfile"
      ? path.dirname(filePath).split(path.sep).pop()!
      : filename.replace("Dockerfile-", "");
  const taskId = scan.path.replace(new RegExp(path.sep, "g"), "-");
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

/** 填充 workflow 主体：name/on.push.paths/on.schedule（等价于原 genWorkflowMain） */
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
    // 额外观察目录包含 context 目录时才追加
    if (extraWatchFile.includes(wf.context))
      main.on.push.paths.push(extraWatchFile);
  }
  return main;
}

/** 填充 build job；config.yml 存在时把其中键合并进 build-push 的 with（等价于原 genBuildJob） */
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

/** 填充 sync-back job：needs 指向 build，末步替换为实际同步命令（等价于原 genSyncJob） */
function genSyncJob(wf: WorkflowConfig): Job {
  const job = syncJob();
  job.needs = [wf.buildJobName];
  job.steps[job.steps.length - 1].run =
    `./image-syncer -r 5 --proc 16 --auth ./sync-tool/auth.json --images ${wf.syncConfigFile}`;
  return job;
}

/** 同步映射：registry:tag -> mirror:tag */
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
    // 跳过 archive 目录
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

// 拷贝 flows/ 下所有文件到 .github/workflows
const flowsPath = path.join(import.meta.dir, "flows");
for (const file of readdirSync(flowsPath)) {
  console.log(`拷贝 ${file} 到 .github/workflows`);
  copyFileSync(`${flowsPath}/${file}`, `.github/workflows/${file}`);
}
