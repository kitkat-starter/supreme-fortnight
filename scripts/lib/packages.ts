import type { Octokit } from "@octokit/rest";
import type { ContainerVersion, PlanEntry } from "./types";

/** 原 delete-untagged.js 的默认阈值：无 tag 且 created_at 超过 14 天 */
export const UNTAGGED_DEFAULT_DAYS = 14;
/** 原 delete-old.js 的默认阈值：含 tag 且 updated_at 超过 30 天 */
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

/** 无 tag 且 created_at 距 now 超过 days 天的版本进删除计划 */
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

/**
 * 含 tag 且 round(距 updated_at 天数) >= days 的版本进删除计划。
 * 沿用原 delete-old.js 的 Math.round 天数公式，边界语义与之一致。
 */
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

/** 按 package 名过滤；wanted 为空表示不过滤 */
export function filterPackages<T extends { pkg: string }>(
  entries: T[],
  wanted?: string,
): T[] {
  return wanted ? entries.filter((e) => e.pkg === wanted) : entries;
}

export type Scope = "org" | "user";

/** 探测 owner 是 org 还是 user：先试 org 端点，404 回退 user */
export async function detectScope(
  octokit: Octokit,
  owner: string,
): Promise<Scope> {
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

/** 列出 owner 名下全部 container 包及其 versions（分页） */
export async function listAllContainerVersions(
  octokit: Octokit,
  owner: string,
  scope: "auto" | Scope,
): Promise<{ pkg: string; versions: ContainerVersion[] }[]> {
  const real: Scope =
    scope === "auto" ? await detectScope(octokit, owner) : scope;
  const packages =
    real === "org"
      ? await octokit.paginate(
          octokit.rest.packages.listPackagesForOrganization,
          {
            org: owner,
            package_type: "container",
            per_page: 100,
          },
        )
      : await octokit.paginate(
          octokit.rest.packages.listPackagesForAuthenticatedUser,
          {
            package_type: "container",
            per_page: 100,
          },
        );
  const result: { pkg: string; versions: ContainerVersion[] }[] = [];
  for (const p of packages) {
    const pkg = p.name;
    const versions =
      real === "org"
        ? await octokit.paginate(
            octokit.rest.packages.getAllPackageVersionsForPackageOwnedByOrg,
            {
              org: owner,
              package_type: "container",
              package_name: pkg,
              per_page: 100,
            },
          )
        : await octokit.paginate(
            octokit.rest.packages
              .getAllPackageVersionsForPackageOwnedByAuthenticatedUser,
            {
              package_type: "container",
              package_name: pkg,
              per_page: 100,
            },
          );
    result.push({ pkg, versions: versions as ContainerVersion[] });
  }
  return result;
}

/** 逐条顺序删除；单条失败不中断，返回成功/失败清单 */
export async function deleteVersions(
  octokit: Octokit,
  owner: string,
  scope: Scope,
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
