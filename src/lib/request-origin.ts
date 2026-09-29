import "server-only";
import { headers } from "next/headers";

/**
 * Origin untuk menyusun tautan yang akan disalin orang (wishlist publik, tautan
 * klaim). Dibaca di server dari header permintaan, bukan `window.location` di
 * client: komponen yang merendernya ikut dirender di server, dan membaca origin
 * di sana berarti tidak ada effect setState maupun beda render antara server
 * dan client.
 */
export async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return host ? `${proto}://${host}` : "";
}
