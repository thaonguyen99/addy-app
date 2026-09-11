import type { AuthUser } from "@/types/api";

export function needsOnboarding(user: AuthUser | null): boolean {
  return user != null && user.onboardingCompletedAt == null;
}
