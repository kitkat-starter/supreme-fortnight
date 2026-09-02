import { describe, test, expect } from "bun:test";
import { parseRemoteUrl, resolveToken } from "./gh";

describe("parseRemoteUrl", () => {
  test.each([
    ["https://github.com/foo/bar.git", { owner: "foo", repo: "bar" }],
    ["https://github.com/foo/bar", { owner: "foo", repo: "bar" }],
    ["git@github.com:foo/bar.git", { owner: "foo", repo: "bar" }],
    ["ssh://git@github.com/foo/bar.git", { owner: "foo", repo: "bar" }],
  ])("%s", (url, expected) => {
    expect(parseRemoteUrl(url)).toEqual(expected);
  });

  test("非 GitHub 地址返回 null", () => {
    expect(parseRemoteUrl("https://gitlab.com/foo/bar.git")).toBeNull();
  });
});

describe("resolveToken", () => {
  test("GITHUB_TOKEN 优先", () => {
    expect(resolveToken({ GITHUB_TOKEN: "env" }, () => "gh")).toBe("env");
  });
  test("回退 gh auth token", () => {
    expect(resolveToken({}, () => "gh")).toBe("gh");
  });
  test("都没有返回 null", () => {
    expect(resolveToken({}, () => null)).toBeNull();
  });
});
