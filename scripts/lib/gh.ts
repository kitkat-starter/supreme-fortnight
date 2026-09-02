import { Octokit } from "@octokit/rest";

export interface RepoRef {
  owner: string;
  repo: string;
}

/** 从 git remote url 解析 owner/repo；支持 https / ssh / git@ 形式，非 GitHub 返回 null */
export function parseRemoteUrl(url: string): RepoRef | null {
  const m = url.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?\/?$/);
  return m ? { owner: m[1], repo: m[2] } : null;
}

/**
 * token 解析链：GITHUB_TOKEN 环境变量优先，其次 ghTokenFn()（生产实现为 `gh auth token`）。
 * env 与 ghTokenFn 均注入，便于测试。
 */
export function resolveToken(
  env: Record<string, string | undefined>,
  ghTokenFn: () => string | null,
): string | null {
  return env.GITHUB_TOKEN?.trim() || ghTokenFn();
}

/** 读取本机 gh CLI 的 token（同步）；未登录或无 gh 时返回 null */
export function ghAuthToken(): string | null {
  try {
    const p = Bun.spawnSync(["gh", "auth", "token"]);
    const t = p.stdout.toString().trim();
    return p.exitCode === 0 && t ? t : null;
  } catch {
    return null;
  }
}

export function createOctokit(token: string): Octokit {
  return new Octokit({ auth: token });
}

/** --repo 参数优先，否则从 git remote.origin.url 解析 */
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
