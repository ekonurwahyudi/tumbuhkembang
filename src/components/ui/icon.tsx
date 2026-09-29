import { cn } from "@/lib/utils";

/**
 * Material Symbols Outlined — set ikon yang dipakai template desain.
 *
 * Font-nya di-host sendiri (`public/fonts/material-symbols-subset.woff2`) dan
 * hanya memuat glyph yang dipakai. Menambah nama ikon baru berarti mengunduh
 * ulang subset-nya; daftar nama ada pada union IconName di bawah.
 *
 * Ikon di sini selalu dekoratif: teks di sebelahnya yang menyampaikan makna.
 * Bila sebuah ikon berdiri sendiri, beri `aria-label` pada elemen pembungkusnya.
 */
export type IconName =
  | "add"
  | "add_circle"
  | "alarm"
  | "alternate_email"
  | "analytics"
  | "apps"
  | "auto_awesome"
  | "arrow_back"
  | "arrow_back_ios_new"
  | "arrow_forward"
  | "badge"
  | "boy"
  | "calendar_today"
  | "card_giftcard"
  | "check"
  | "check_circle"
  | "chevron_right"
  | "child_care"
  | "close"
  | "content_copy"
  | "delete"
  | "download"
  | "edit"
  | "edit_note"
  | "event_upcoming"
  | "expand_more"
  | "face"
  | "family_restroom"
  | "favorite"
  | "girl"
  | "health_and_safety"
  | "height"
  | "history"
  | "history_edu"
  | "home"
  | "hourglass_top"
  | "info"
  | "link"
  | "list_alt"
  | "local_hospital"
  | "lock"
  | "lock_reset"
  | "logout"
  | "mail"
  | "manage_accounts"
  | "medical_services"
  | "menu_book"
  | "monitor_heart"
  | "notifications"
  | "nutrition"
  | "person"
  | "progress_activity"
  | "psychology"
  | "scale"
  | "schedule"
  | "security"
  | "sentiment_satisfied"
  | "settings"
  | "shield"
  | "smartphone"
  | "straighten"
  | "swap_horiz"
  | "sync"
  | "trending_up"
  | "vaccines"
  | "verified"
  | "verified_user"
  | "vital_signs"
  | "visibility"
  | "visibility_off"
  | "water_bottle"
  | "water_drop";

export function Icon({
  name,
  filled,
  className,
  ...props
}: { name: IconName; filled?: boolean } & React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      translate="no"
      data-filled={filled ? "" : undefined}
      className={cn("material-symbols-outlined shrink-0 leading-none select-none", className)}
      {...props}
    >
      {name}
    </span>
  );
}
