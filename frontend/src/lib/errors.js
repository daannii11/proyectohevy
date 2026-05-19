export function toErrorMessage(error, fallback) {
  if (error instanceof Error) return error.message;
  if (error && typeof error.message === "string") return error.message;
  return fallback;
}

export function assertNoSupabaseError(error, fallback) {
  if (error) {
    throw new Error(error.message || fallback);
  }
}
