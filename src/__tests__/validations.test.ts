import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema, otpVerifySchema, locationSchema, lobbyJoinSchema } from "@/lib/validations";

describe("loginSchema", () => {
  it("accepts valid input", () => {
    const result = loginSchema.safeParse({ email: "test@test.com", password: "123456" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-email", password: "123456" });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({ email: "test@test.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accepts valid input", () => {
    const result = registerSchema.safeParse({
      email: "test@test.com",
      username: "test_user",
      displayName: "Test User",
      password: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short username", () => {
    const result = registerSchema.safeParse({
      email: "test@test.com",
      username: "ab",
      displayName: "Test",
      password: "123456",
    });
    expect(result.success).toBe(false);
  });

  it("rejects username with special chars", () => {
    const result = registerSchema.safeParse({
      email: "test@test.com",
      username: "test user!",
      displayName: "Test",
      password: "123456",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = registerSchema.safeParse({
      email: "test@test.com",
      username: "testuser",
      displayName: "Test",
      password: "12345",
    });
    expect(result.success).toBe(false);
  });
});

describe("otpVerifySchema", () => {
  it("accepts valid 6-digit code", () => {
    const result = otpVerifySchema.safeParse({ email: "test@test.com", code: "123456" });
    expect(result.success).toBe(true);
  });

  it("rejects non-numeric code", () => {
    const result = otpVerifySchema.safeParse({ email: "test@test.com", code: "abcdef" });
    expect(result.success).toBe(false);
  });

  it("rejects short code", () => {
    const result = otpVerifySchema.safeParse({ email: "test@test.com", code: "12345" });
    expect(result.success).toBe(false);
  });
});

describe("locationSchema", () => {
  it("accepts valid coordinates", () => {
    const result = locationSchema.safeParse({ latitude: 47.9, longitude: 106.9 });
    expect(result.success).toBe(true);
  });

  it("rejects out-of-range latitude", () => {
    const result = locationSchema.safeParse({ latitude: 91, longitude: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects out-of-range longitude", () => {
    const result = locationSchema.safeParse({ latitude: 0, longitude: 181 });
    expect(result.success).toBe(false);
  });
});

describe("lobbyJoinSchema", () => {
  it("accepts valid 6-char code", () => {
    const result = lobbyJoinSchema.safeParse({ code: "ABC123" });
    expect(result.success).toBe(true);
  });

  it("rejects short code", () => {
    const result = lobbyJoinSchema.safeParse({ code: "ABC" });
    expect(result.success).toBe(false);
  });
});
