import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/** 从文件内容提取 uses: owner/name@version 引用（YAML 与 TS 写法均覆盖） */
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

/** 找出同名 action 存在多个版本的漂移项 */
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

/** 扫描 flows / 生成 workflows / 模板工厂，报告 uses 版本漂移；有漂移返回 1 */
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
