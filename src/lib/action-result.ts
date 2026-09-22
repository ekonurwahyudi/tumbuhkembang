/** Bentuk hasil seragam untuk semua server action. Error teknis tidak pernah bocor ke client. */
export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; fields?: Record<string, string> } };

export const ok = <T>(data: T): ActionResult<T> => ({ success: true, data });

export const fail = (
  code: string,
  message: string,
  fields?: Record<string, string>,
): ActionResult<never> => ({ success: false, error: { code, message, fields } });

/** Ubah ZodError tree jadi map field -> pesan pertama. */
export function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = String(i.path[0] ?? "_");
    if (!out[key]) out[key] = i.message;
  }
  return out;
}

/** Log detail teknis di server, kembalikan pesan ramah ke user. */
export function handleUnexpected(scope: string, err: unknown): ActionResult<never> {
  console.error(`[${scope}]`, err);
  return fail("INTERNAL_ERROR", "Terjadi kesalahan. Silakan coba kembali.");
}
