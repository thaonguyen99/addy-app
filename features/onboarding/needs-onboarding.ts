import type { AuthUser } from "@/services/auth";

export function needsOnboarding(user: AuthUser | null): boolean {
  return user != null && user.onboardingCompletedAt == null;
}
