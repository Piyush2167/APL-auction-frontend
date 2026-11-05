import { z } from "zod";

// Mirrors the backend password policy (backend remains authoritative).
export const password = z.string().min(8, "Use at least 8 characters").max(128, "Use at most 128 characters")
  .regex(/[A-Za-z]/, "Include at least one letter").regex(/\d/, "Include at least one number");

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current or temporary password"),
  newPassword: password,
  confirm: z.string(),
}).refine((d) => d.newPassword === d.confirm, { path: ["confirm"], message: "Passwords do not match" });

export const forgotSchema = z.object({ email: z.email("Enter a valid email address") });

export const resetSchema = z.object({ password, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords do not match" });
