import * as Sentry from "@sentry/nextjs";

const isSentryEnabled = !!process.env.SENTRY_DSN;

export function initSentry() {
  if (!isSentryEnabled) return;

  Sentry.init({
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
    enabled: process.env.NODE_ENV === "production",
  });
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  console.error(error);

  if (isSentryEnabled) {
    if (context) Sentry.setContext("extra", context);
    Sentry.captureException(error);
  }
}

export function captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
  if (level === "error") console.error(message);
  else console.log(`[${level}]`, message);

  if (isSentryEnabled) {
    Sentry.captureMessage(message, level);
  }
}
