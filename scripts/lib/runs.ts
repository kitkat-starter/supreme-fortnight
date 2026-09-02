import type { Octokit } from "@octokit/rest";
import type { RepoRef } from "./gh";
import type { RunInfo } from "./types";

/**
 * runs 清理计划：created_at 距 now 超过 days 的 runs 中，
 * 排除按时间降序保留的最新 keep 条（即使超期也保留）。
 */
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

/** 逐条顺序删除；单条失败不中断 */
export async function deleteRuns(
  octokit: Octokit,
  repo: RepoRef,
  entries: RunInfo[],
): Promise<{ ok: RunInfo[]; failed: { entry: RunInfo; message: string }[] }> {
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
