import { describe, it, expect } from "vitest";
import { generateLobbyCode, calculateLevel, xpForLevel, xpToNextLevel, levelProgress, formatTimeAgo } from "@/lib/utils";

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

describe("calculateLevel (quadratic curve)", () => {
  it("returns 1 for 0 XP", () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it("returns 1 for XP less than 100", () => {
    expect(calculateLevel(99)).toBe(1);
  });

  it("returns 2 for 100 XP", () => {
    expect(calculateLevel(100)).toBe(2);
  });

  it("returns 3 for 300 XP", () => {
    expect(calculateLevel(300)).toBe(3);
  });

  it("returns 5 for 1000 XP", () => {
    expect(calculateLevel(1000)).toBe(5);
  });

  it("returns 10 for 4500 XP", () => {
    expect(calculateLevel(4500)).toBe(10);
  });
});

describe("xpForLevel", () => {
  it("returns 0 for level 1", () => {
    expect(xpForLevel(1)).toBe(0);
  });

  it("returns 100 for level 2", () => {
    expect(xpForLevel(2)).toBe(100);
  });

  it("returns 300 for level 3", () => {
    expect(xpForLevel(3)).toBe(300);
  });

  it("returns 1000 for level 5", () => {
    expect(xpForLevel(5)).toBe(1000);
  });

  it("returns 4500 for level 10", () => {
    expect(xpForLevel(10)).toBe(4500);
  });
});

describe("xpToNextLevel", () => {
  it("returns 100 for 0 XP (level 1 → 2)", () => {
    expect(xpToNextLevel(0)).toBe(100);
  });

  it("returns 200 for 100 XP (level 2 → 3)", () => {
    expect(xpToNextLevel(100)).toBe(200);
  });
});

describe("levelProgress", () => {
  it("returns 0 at start of level", () => {
    expect(levelProgress(0)).toBe(0);
    expect(levelProgress(100)).toBe(0);
  });

  it("returns 0.5 at midpoint of level", () => {
    // Level 1: 0-99, midpoint = 50
    expect(levelProgress(50)).toBe(0.5);
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
