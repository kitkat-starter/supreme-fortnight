/** scripts/config.json 的单条扫描配置 */
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

/** 生成单个 workflow 所需的全部参数 */
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

/** GHCR container package version 的最小结构（与 @octokit/rest 响应结构兼容） */
export interface ContainerVersion {
  id: number;
  created_at: string;
  updated_at: string;
  metadata?: { container?: { tags?: string[] | null } | null } | null;
}

/** 待删除的 package version 计划条目 */
export interface PlanEntry {
  pkg: string;
  versionId: number;
  createdAt: string;
  updatedAt: string;
}

/** GitHub Actions workflow run 的最小结构 */
export interface RunInfo {
  id: number;
  name: string | null;
  createdAt: string;
}
