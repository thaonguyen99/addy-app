import { router, type Href } from "expo-router";

/** Go back when possible; otherwise replace with a known route. */
export function safeBack(fallback: Href): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallback);
}

/** Dismiss modals only when the current navigator can handle it. */
export function safeDismissAll(): void {
  if (router.canDismiss()) {
    router.dismissAll();
  }
}
