import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * Avatar anak: foto bila ada, ikon bayi bila belum.
 *
 * Satu komponen dipakai di semua tempat yang menampilkan nama anak, supaya
 * tidak ada layar yang tertinggal memakai ikon saat fotonya sudah diunggah.
 */
export function ChildAvatar({
  child,
  className,
  iconClassName,
  rounded = "full",
}: {
  child: { id: string; name: string; photoKey: string | null };
  className?: string;
  iconClassName?: string;
  /** Sebagian kartu memakai sudut membulat, bukan lingkaran penuh. */
  rounded?: "full" | "2xl";
}) {
  const shape = rounded === "full" ? "rounded-full" : "rounded-2xl";

  return (
    <Avatar className={cn("bg-accent after:hidden", shape, className)}>
      {child.photoKey && (
        <AvatarImage
          // Query key membuat URL berubah setiap foto diganti, jadi gambar lama
          // tidak pernah tertinggal di cache browser.
          src={`/children/${child.id}/photo?v=${encodeURIComponent(child.photoKey)}`}
          alt={`Foto ${child.name}`}
          className={shape}
        />
      )}
      <AvatarFallback className={cn("bg-accent text-primary", shape)}>
        <Icon name="child_care" filled className={iconClassName} />
      </AvatarFallback>
    </Avatar>
  );
}
