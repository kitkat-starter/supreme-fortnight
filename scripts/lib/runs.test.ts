import { describe, test, expect } from "bun:test";
import { buildRunsPlan } from "./runs";
import type { RunInfo } from "./types";

const DAY = 24 * 60 * 60 * 1000;
const now = new Date("2026-09-03T00:00:00Z");
const r = (id: number, daysAgo: number): RunInfo => ({
  id,
  name: `run-${id}`,
  createdAt: new Date(now.getTime() - daysAgo * DAY).toISOString(),
});

describe("buildRunsPlan", () => {
  test("只删超过 older-than 的；keep 保留最新 N 条（即使超期）", () => {
    const runs = [r(1, 1), r(2, 10), r(3, 40), r(4, 50)];
    // keep=1 保留 run1；超期且非保留：run3、run4（run2 只有 10 天不超 30）
    expect(buildRunsPlan(runs, 30, 1, now).map((e) => e.id)).toEqual([3, 4]);
  });
  test("keep=0 时全部超期者入选", () => {
    const runs = [r(1, 40), r(2, 50)];
    expect(buildRunsPlan(runs, 30, 0, now).map((e) => e.id)).toEqual([1, 2]);
  });
});
