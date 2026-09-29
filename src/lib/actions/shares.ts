"use server";

import { revalidatePath } from "next/cache";
import {
  listChildren,
  revokeShare,
  upsertShare,
} from "@/lib/data/children";
import { fail, fieldErrors, handleUnexpected, ok, type ActionResult } from "@/lib/action-result";
import { requireUser } from "@/lib/auth";
import { shareInviteSchema } from "@/schemas/account";

/**
 * Buat undangan akses pasangan untuk SEMUA anak milik user.
 * Satu token per anak — client menampilkan token anak pertama (semua sama
 * jangka waktunya). ponytail: bisa dioptimasi jadi 1 token multi-anak;
 * sekarang 1-token-per-anak karena skema DB sudah ada, upgrade nanti.
 */
export async function createShareAction(
  formData: FormData,
): Promise<ActionResult<{ token: string }>> {
  const user = await requireUser();
  const parsed = shareInviteSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success)
    return fail("VALIDATION_ERROR", "Data tidak valid", fieldErrors(parsed.error.issues));

  try {
    const owned = await listChildren(user.id);
    if (owned.length === 0)
      return fail("VALIDATION_ERROR", "Belum ada profil anak untuk dibagikan.");

    let firstToken = "";
    for (const child of owned) {
      const share = await upsertShare({
        childId: child.id,
        ownerId: user.id,
        inviteeEmail: parsed.data.email,
      });
      if (!firstToken) firstToken = share.token;
    }

    revalidatePath("/settings");
    return ok({ token: firstToken });
  } catch (err) {
    return handleUnexpected("createShareAction", err);
  }
}

export async function revokeShareAction(shareId: string): Promise<ActionResult> {
  const user = await requireUser();
  try {
    const row = await revokeShare(shareId, user.id);
    if (!row) return fail("NOT_FOUND", "Undangan tidak ditemukan");
    revalidatePath("/settings");
    return ok(undefined);
  } catch (err) {
    return handleUnexpected("revokeShareAction", err);
  }
}
