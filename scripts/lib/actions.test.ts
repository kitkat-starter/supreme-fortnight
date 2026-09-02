import { describe, test, expect } from "bun:test";
import { scanUses, findDrift } from "./actions";

describe("scanUses", () => {
  test("提取 YAML 与 TS 两种写法", () => {
    const content = [
      "      - uses: actions/checkout@v4",
      '      - uses: "docker/setup-buildx-action@v4"',
      "        uses: 'foo/bar@v1.2.3'",
      'uses: "actions/checkout@v7"',
    ].join("\n");
    const refs = scanUses(content);
    expect(refs).toContainEqual({ action: "actions/checkout", version: "v4" });
    expect(refs).toContainEqual({
      action: "docker/setup-buildx-action",
      version: "v4",
    });
    expect(refs).toContainEqual({ action: "foo/bar", version: "v1.2.3" });
    expect(refs).toContainEqual({ action: "actions/checkout", version: "v7" });
  });
});

describe("findDrift", () => {
  test("同名 action 多版本被报告", () => {
    const refs = [
      { action: "actions/checkout", version: "v4", source: "flows/a.yml" },
      { action: "actions/checkout", version: "v7", source: "gen/workflow.ts" },
      { action: "actions/cache", version: "v4", source: "flows/a.yml" },
    ];
    const drift = findDrift(refs);
    expect(drift).toHaveLength(1);
    expect(drift[0].action).toBe("actions/checkout");
    expect(drift[0].versions.map((v) => v.version).sort()).toEqual([
      "v4",
      "v7",
    ]);
  });
});
