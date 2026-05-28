import { describe, it, expect } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows requests within limit", () => {
    const key = `test-${Date.now()}-1`;
    const r1 = rateLimit(key, { maxRequests: 3, windowMs: 10000 });
    expect(r1.success).toBe(true);
    expect(r1.remaining).toBe(2);
  });

  it("blocks after exceeding limit", () => {
    const key = `test-${Date.now()}-2`;
    rateLimit(key, { maxRequests: 2, windowMs: 10000 });
    rateLimit(key, { maxRequests: 2, windowMs: 10000 });
    const r3 = rateLimit(key, { maxRequests: 2, windowMs: 10000 });
    expect(r3.success).toBe(false);
    expect(r3.remaining).toBe(0);
  });

  it("resets after window expires", async () => {
    const key = `test-${Date.now()}-3`;
    rateLimit(key, { maxRequests: 1, windowMs: 50 });
    const blocked = rateLimit(key, { maxRequests: 1, windowMs: 50 });
    expect(blocked.success).toBe(false);

    await new Promise((r) => setTimeout(r, 60));
    const reset = rateLimit(key, { maxRequests: 1, windowMs: 50 });
    expect(reset.success).toBe(true);
  });
});
