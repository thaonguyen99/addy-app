import * as Sentry from "@sentry/react-native";

import { SENTRY_DSN } from "@/lib/env";
import { scrubEvent } from "@/lib/sentry-scrub";

/**
 * Crash and error reports only, kept in line with the Data safety form: adding
 * anything here (user ids, tracing, replay) means updating that form too.
 */
export function initSentry() {
  if (__DEV__ || !SENTRY_DSN) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    sendDefaultPii: false,
    // Not beforeBreadcrumb: that only runs in JS, while native crash reports
    // carry their own HTTP breadcrumbs with full URLs.
    maxBreadcrumbs: 0,
    enableAutoPerformanceTracing: false,
    enableCaptureFailedRequests: false,
    attachScreenshot: false,
    attachViewHierarchy: false,
    beforeSend: scrubEvent,
  });
}
