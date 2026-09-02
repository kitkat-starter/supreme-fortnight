import { describe, test, expect } from "bun:test";
import { buildUntaggedPlan, buildOldPlan, filterPackages } from "./packages";
import type { ContainerVersion } from "./types";

const DAY = 24 * 60 * 60 * 1000;
const now = new Date("2026-09-03T00:00:00Z");
const v = (
  id: number,
  o: Partial<ContainerVersion> = {},
): ContainerVersion => ({
  id,
  created_at: new Date(now.getTime() - 40 * DAY).toISOString(),
  updated_at: new Date(now.getTime() - 40 * DAY).toISOString(),
  metadata: { container: { tags: ["v1"] } },
  ...o,
});

describe("buildUntaggedPlan", () => {
  test("无 tag 且超过 14 天才进计划", () => {
    const versions = [
      v(1, { metadata: { container: { tags: [] } } }), // 40d untagged -> 删
      v(2, {
        metadata: { container: { tags: [] } },
        created_at: new Date(now.getTime() - 5 * DAY).toISOString(),
      }), // 5d untagged -> 留
      v(3), // 40d tagged -> 留
    ];
    const plan = buildUntaggedPlan(versions, "stack", 14, now);
    expect(plan.map((e) => e.versionId)).toEqual([1]);
  });
});

describe("buildOldPlan", () => {
  test("含 tag 且 round 天数 >= 30 进计划（原脚本公式）", () => {
    const versions = [
      v(1), // 40d tagged -> 删
      v(2, { updated_at: new Date(now.getTime() - 29.4 * DAY).toISOString() }), // round=29 -> 留
      v(3, { metadata: { container: { tags: [] } } }), // untagged 不归 old 管 -> 留
    ];
    const plan = buildOldPlan(versions, "stack", 30, now);
    expect(plan.map((e) => e.versionId)).toEqual([1]);
  });
});

describe("filterPackages", () => {
  test("指定 pkg 时过滤，未指定全保留", () => {
    const entries = [{ pkg: "a" }, { pkg: "b" }];
    expect(filterPackages(entries, "b")).toEqual([{ pkg: "b" }]);
    expect(filterPackages(entries)).toEqual(entries);
  });
});
