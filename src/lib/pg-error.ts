// Drizzle (postgres-js) membungkus error asli di DrizzleQueryError.cause, jadi
// "code" bisa ada di error itu sendiri atau di .cause tergantung driver.
export function pgErrorCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  if ("code" in err && typeof err.code === "string") return err.code;
  if ("cause" in err) return pgErrorCode((err as { cause?: unknown }).cause);
  return undefined;
}

export const isDuplicateKey = (err: unknown) => pgErrorCode(err) === "23505";
