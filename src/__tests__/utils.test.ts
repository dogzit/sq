import { describe, it, expect } from "vitest";
import { generateLobbyCode, calculateLevel, xpForNextLevel, formatTimeAgo } from "@/lib/utils";

describe("generateLobbyCode", () => {
  it("returns a 6-character uppercase string", () => {
    const code = generateLobbyCode();
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });

  it("generates unique codes", () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateLobbyCode()));
    expect(codes.size).toBeGreaterThan(90);
  });
});

describe("calculateLevel", () => {
  it("returns 1 for 0 XP", () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it("returns 1 for XP less than 200", () => {
    expect(calculateLevel(199)).toBe(1);
  });

  it("returns 2 for 200 XP", () => {
    expect(calculateLevel(200)).toBe(2);
  });

  it("returns correct level for higher XP", () => {
    expect(calculateLevel(1000)).toBe(6);
  });
});

describe("xpForNextLevel", () => {
  it("returns XP threshold for level 1", () => {
    expect(xpForNextLevel(1)).toBe(200);
  });

  it("returns XP threshold for level 5", () => {
    expect(xpForNextLevel(5)).toBe(1000);
  });
});

describe("formatTimeAgo", () => {
  it("returns 'just now' for recent dates", () => {
    const result = formatTimeAgo(new Date());
    expect(result).toBe("just now");
  });

  it("returns minutes for older dates", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const result = formatTimeAgo(fiveMinAgo);
    expect(result).toBe("5m ago");
  });

  it("returns hours for much older dates", () => {
    const twoHrsAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const result = formatTimeAgo(twoHrsAgo);
    expect(result).toBe("2h ago");
  });
});
