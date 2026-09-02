import { describe, test, expect } from "bun:test";
import { parseDays } from "./cli";

describe("parseDays", () => {
  test.each([
    ["14d", 14],
    ["30", 30],
    ["7d", 7],
  ])("%s -> %i", (input, expected) => {
    expect(parseDays(input)).toBe(expected);
  });
  test("非法输入抛错", () => {
    expect(() => parseDays("abc")).toThrow();
    expect(() => parseDays("-5d")).toThrow();
  });
});
