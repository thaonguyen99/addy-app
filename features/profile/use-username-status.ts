import { useEffect, useRef, useState } from "react";

import { USERNAME_PATTERN } from "@/features/profile/schema";
import { useCheckUsernameMutation } from "@/services/users";

export type UsernameStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "invalid";

/** Debounced availability check for a username being edited. */
export function useUsernameStatus(
  value: string,
  currentUsername: string,
): UsernameStatus {
  const { mutateAsync: checkUsernameAvailable } = useCheckUsernameMutation();
  const [status, setStatus] = useState<UsernameStatus>("idle");
  const latestRef = useRef(value);
  latestRef.current = value.trim().toLowerCase();

  useEffect(() => {
    const next = value.trim().toLowerCase();
    if (next === currentUsername || next === "") {
      setStatus("idle");
      return;
    }
    if (!USERNAME_PATTERN.test(next)) {
      setStatus("invalid");
      return;
    }

    setStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const { available } = await checkUsernameAvailable(next);
        if (latestRef.current === next) {
          setStatus(available ? "available" : "taken");
        }
      } catch {
        setStatus("idle");
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [value, currentUsername, checkUsernameAvailable]);

  return status;
}

export function usernameHint(status: UsernameStatus): string | undefined {
  switch (status) {
    case "checking":
      return "Checking availability…";
    case "taken":
      return "That username is taken.";
    case "invalid":
      return "Only lowercase letters, numbers, underscores and dots.";
    default:
      return undefined;
  }
}
