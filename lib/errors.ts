export function unwrapError(err: unknown, fallback = "Unknown error"): string {
  if (typeof err === "string") {
    console.error("Error:", { message: err });
    return err;
  }
  if (err && typeof err === "object") {
    const anyErr = err as { message?: string; error?: string; code?: unknown; stack?: unknown };
    const message = anyErr.message || anyErr.error || fallback;
    console.error("Error:", { message, code: anyErr.code, stack: anyErr.stack });
    return message;
  }
  console.error("Error:", err);
  return fallback;
}
