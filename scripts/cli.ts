import { parseArgs } from "node:util";
import {
  resolveToken,
  ghAuthToken,
  createOctokit,
  currentRepo,
} from "./lib/gh";
import {
  listAllContainerVersions,
  buildUntaggedPlan,
  buildOldPlan,
  deleteVersions,
  filterPackages,
  detectScope,
  UNTAGGED_DEFAULT_DAYS,
  OLD_DEFAULT_DAYS,
  type Scope,
} from "./lib/packages";
import { listWorkflowRuns, buildRunsPlan, deleteRuns } from "./lib/runs";
import { runCheck } from "./lib/actions";
import type { PlanEntry, RunInfo } from "./lib/types";

/** "14d" / "30" -> 天数；非法输入抛错 */
export function parseDays(input: string): number {
  const m = input.match(/^(\d+)d?$/);
  const n = m ? Number(m[1]) : NaN;
  if (!Number.isInteger(n) || n <= 0)
    throw new Error(`--older-than 需要形如 30 或 30d，收到: ${input}`);
  return n;
}

/** 打印清理计划并返回条目数 */
export function formatPlan(
  title: string,
  entries: Array<PlanEntry | RunInfo>,
): number {
  console.log(`\n== ${title}（${entries.length} 项）==`);
  for (const e of entries) {
    const target =
      "versionId" in e
        ? `${e.pkg} @ ${e.versionId}`
        : `${e.name ?? "(unnamed)"} #${e.id}`;
    console.log(`  - ${target}  (${e.createdAt})`);
  }
  if (entries.length === 0) console.log("  （无待清理项）");
  return entries.length;
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

function usage(): void {
  console.log(`用法: bun run cli -- <命令> [选项]

命令:
  clean-untagged   清理 GHCR 无 tag 的 package versions（默认 > 14 天，原 delete-untagged 语义）
  clean-old        清理含 tag 且过旧的 package versions（默认 > 30 天，原 delete-old 语义）
  clean-runs       清理 Actions workflow runs（默认 > 30 天）
  check-actions    检查全仓 uses: action 版本一致性

通用选项:
  --execute             真正执行删除（默认 dry-run）
  --repo owner/name     目标仓库（默认从 git remote 解析）
  --scope auto|org|user packages 归属（默认 auto：org 优先探测，404 回退 user）
  --package <name>      仅处理指定 package（clean-untagged/clean-old）
  --older-than <Nd>     时间阈值（clean-runs/clean-old 默认 30d；clean-untagged 默认 14d）
  --keep <N>            保留最新 N 条 runs（clean-runs，默认 0）`);
}

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
        default:
          kind === "untagged"
            ? `${UNTAGGED_DEFAULT_DAYS}d`
            : `${OLD_DEFAULT_DAYS}d`,
      },
      keep: { type: "string", default: "0" },
    },
    allowPositionals: false,
  });
  const days = parseDays(parsed.values["older-than"] as string);
  const keep = Number(parsed.values.keep ?? "0");
  const scopeVal = parsed.values.scope as string;
  if (!["auto", "org", "user"].includes(scopeVal))
    throw new Error(`--scope 需为 auto|org|user，收到: ${scopeVal}`);
  const execute = parsed.values.execute === true;
  const wanted = parsed.values.package as string | undefined;

  const token = resolveToken(process.env, ghAuthToken);
  if (!token) {
    console.error("未找到 token：请设置 GITHUB_TOKEN 或先 `gh auth login`。");
    return 1;
  }
  const octokit = createOctokit(token);
  const repo = await currentRepo(parsed.values.repo as string | undefined);

  if (kind === "runs") {
    const runs = await listWorkflowRuns(octokit, repo);
    const plan = buildRunsPlan(runs, days, keep, new Date());
    formatPlan(`workflow runs 清理（> ${days} 天，keep ${keep}）`, plan);
    if (!execute) return hint();
    const { ok, failed } = await deleteRuns(octokit, repo, plan);
    report(ok, failed);
    return failed.length > 0 ? 1 : 0;
  }

  const all = filterPackages(
    await listAllContainerVersions(
      octokit,
      repo.owner,
      scopeVal as "auto" | Scope,
    ),
    wanted,
  );
  const plan = all.flatMap(({ pkg, versions }) =>
    kind === "untagged"
      ? buildUntaggedPlan(versions, pkg, days, new Date())
      : buildOldPlan(versions, pkg, days, new Date()),
  );
  formatPlan(
    `${kind} versions 清理（${kind === "untagged" ? "无 tag 且" : "含 tag 且"} > ${days} 天）`,
    plan,
  );
  if (!execute) return hint();
  const realScope: Scope =
    scopeVal === "auto"
      ? await detectScope(octokit, repo.owner)
      : (scopeVal as Scope);
  const { ok, failed } = await deleteVersions(
    octokit,
    repo.owner,
    realScope,
    plan,
  );
  report(ok, failed);
  return failed.length > 0 ? 1 : 0;
}

async function dispatch(
  cmd: string | undefined,
  argv: string[],
): Promise<number> {
  try {
    switch (cmd) {
      case "clean-untagged":
        return await cleanupFlow("untagged", argv);
      case "clean-old":
        return await cleanupFlow("old", argv);
      case "clean-runs":
        return await cleanupFlow("runs", argv);
      case "check-actions":
        return await runCheck();
      case undefined:
      case "--help":
      case "-h":
        usage();
        return cmd === undefined ? 2 : 0;
      default:
        console.error(`未知命令: ${cmd}\n`);
        usage();
        return 2;
    }
  } catch (e) {
    console.error(`错误: ${e instanceof Error ? e.message : String(e)}`);
    return 1;
  }
}

if (import.meta.main) {
  const [cmd, ...rest] = Bun.argv.slice(2);
  process.exit(await dispatch(cmd, rest));
}
