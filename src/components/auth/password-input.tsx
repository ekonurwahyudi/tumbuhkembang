"use client";

import { useState } from "react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";

/** Input kata sandi dengan tombol tampil/sembunyi, sesuai template. */
export function PasswordInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative flex w-full items-center">
      <Input {...props} type={visible ? "text" : "password"} className={cn("pr-11", className)} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        className="text-slate-400 hover:text-slate-600 absolute right-2 grid size-8 place-items-center rounded-lg transition-colors"
      >
        <Icon name={visible ? "visibility_off" : "visibility"} className="text-[18px]" />
      </button>
    </div>
  );
}
