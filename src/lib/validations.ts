import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  username: z.string().min(3, "Username must be 3+ characters").max(20).regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, underscores only"),
  displayName: z.string().min(1, "Display name required").max(50),
  password: z.string().min(6, "Password must be 6+ characters"),
});

export const otpSendSchema = z.object({
  email: z.string().email("Invalid email"),
});

export const otpVerifySchema = z.object({
  email: z.string().email("Invalid email"),
  code: z.string().length(6, "Code must be 6 digits").regex(/^\d+$/, "Digits only"),
});

export const lobbyCreateSchema = z.object({
  name: z.string().min(1, "Name required").max(50),
  maxMembers: z.number().int().min(2).max(50).optional(),
});

export const lobbyJoinSchema = z.object({
  code: z.string().length(6, "Code must be 6 characters"),
});

export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
});

export const emergencySchema = z.object({
  lobbyId: z.string().min(1, "Lobby ID required"),
});

export const questGenerateSchema = z.object({
  lobbyId: z.string().min(1, "Lobby ID required"),
});

export const shopUseSchema = z.object({
  purchaseId: z.string().min(1),
  targetUserId: z.string().min(1),
});

export const profileUpdateSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/).optional(),
  bio: z.string().max(120).optional(),
});

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message || "Validation failed" };
  }
  return { success: true, data: result.data };
}
