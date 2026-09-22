"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/action-result";

/**
 * React mengosongkan form yang tidak terkontrol setiap kali server action selesai.
 * Tanpa penanganan ini, satu kesalahan validasi memaksa orang tua mengetik ulang
 * seluruh isian. Hook ini mengembalikan nilai yang barusan dikirim supaya dapat
 * dipasang kembali sebagai defaultValue.
 *
 * Field password sengaja tidak dikembalikan — tidak lazim menaruh password kembali
 * ke DOM, dan mengetik ulangnya jauh lebih singkat daripada satu formulir penuh.
 */
export type FormValues = Record<string, string>;

type FormState<T> = { result: ActionResult<T> | null; values: FormValues };

const isPasswordField = (key: string) => /password/i.test(key);

function collectValues(formData: FormData): FormValues {
  const values: FormValues = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !isPasswordField(key)) values[key] = value;
  }
  return values;
}

export function useFormAction<T>(
  action: (formData: FormData) => Promise<ActionResult<T>>,
  onSuccess?: (data: T) => void | Promise<void>,
) {
  const [state, dispatch, pending] = useActionState<FormState<T>, FormData>(
    async (_prev, formData) => {
      const values = collectValues(formData);
      const result = await action(formData);
      if (result.success) await onSuccess?.(result.data);
      return { result, values };
    },
    { result: null, values: {} },
  );

  const { result } = state;
  const fields = result && !result.success ? result.error.fields : undefined;

  return {
    action: dispatch,
    pending,
    values: state.values,
    fields,
    /** Error tingkat form — hanya bila tidak ada error per field. */
    formError: result && !result.success && !fields ? result.error.message : undefined,
  };
}
