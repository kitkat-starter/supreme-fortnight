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

  test("buildWorkflowConfig: Dockerfile-<tag> 用后缀做 tag（taskId 只取 scan.path，不含子目录）", () => {
    const wc = buildWorkflowConfig(
      scan,
      "/abs/repo/builds/stack/java/Dockerfile-21",
      "/abs/repo",
    );
    expect(wc.tag).toBe("21");
    expect(wc.cfg.workflowFileName).toBe(
      ".github/workflows/builds-stack-21.yml",
    );
  });

  test("genWorkflowMain: paths 含 context，extraScanFiles 命中 context 时追加", () => {
    const { cfg } = buildWorkflowConfig(
      scan,
      "/abs/repo/builds/stack/php-fpm/Dockerfile",
      "/abs/repo",
    );
    const main = genWorkflowMain(scan, cfg);
    expect(main.name).toBe("构建 builds-stack-php-fpm 镜像");
    expect(main.on.push.paths).toContain("builds/stack/php-fpm/Dockerfile");
    expect(main.on.push.paths).toContain("builds/stack/php-fpm/scripts/*");
    expect(main.on.schedule).toEqual(scan.schedule);
  });
});
