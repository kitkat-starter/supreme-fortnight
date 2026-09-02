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
