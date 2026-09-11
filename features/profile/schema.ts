import { z } from "zod";

export const USERNAME_PATTERN = /^[a-z0-9_.]+$/;

export const profileFormSchema = z.object({
  name: z.string().trim().max(100, "Keep it under 100 characters"),
  username: z
    .string()
    .trim()
    .min(1, "Username is required")
    .max(100, "Keep it under 100 characters")
    .regex(
      USERNAME_PATTERN,
      "Only lowercase letters, numbers, underscores and dots",
    ),
  bio: z.string().trim().max(300, "Keep it under 300 characters"),
});

export type ProfileForm = z.infer<typeof profileFormSchema>;

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordForm = z.infer<typeof changePasswordFormSchema>;
