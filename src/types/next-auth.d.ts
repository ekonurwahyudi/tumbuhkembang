import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/db/schema";

declare module "next-auth" {
  interface Session {
    /**
     * `role` hanya terisi oleh session() di src/lib/auth/index.ts, yang membaca DB.
     * Versi edge di config.ts (dipakai middleware) sengaja tidak mengisinya.
     */
    user: { id: string; role: UserRole; photoKey?: string | null } & DefaultSession["user"];
  }
}
