import "server-only";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

/**
 * Penyimpanan objek (Cloudflare R2, S3-compatible) untuk foto anak & user.
 *
 * Objek sengaja TIDAK dibuat publik. Foto hanya boleh dilihat pemiliknya,
 * jadi berkasnya diambil lewat route terotorisasi yang mengecek kepemilikan
 * dulu — bukan lewat URL publik bucket.
 */

const BUCKET = process.env.R2_BUCKET;

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

let client: S3Client | null = null;

/** Null ketika env belum diisi — pemanggil memperlakukan fitur foto sebagai nonaktif. */
function s3(): S3Client | null {
  if (!BUCKET) return null;
  const { R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
  if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) return null;

  client ??= new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    forcePathStyle: true,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });
  return client;
}

export const photoStorageReady = () => s3() !== null;

async function putPhoto(prefix: string, id: string, body: Uint8Array, contentType: string) {
  const c = s3();
  if (!c) throw new Error("Penyimpanan foto belum dikonfigurasi");

  const key = `${prefix}/${id}/${Date.now()}.${EXT[contentType] ?? "bin"}`;
  await c.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "private, max-age=31536000, immutable",
    }),
  );
  return key;
}

async function getPhoto(key: string): Promise<{ body: ReadableStream; contentType: string } | null> {
  const c = s3();
  if (!c) return null;
  try {
    const r = await c.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    if (!r.Body) return null;
    return { body: r.Body.transformToWebStream(), contentType: r.ContentType ?? "application/octet-stream" };
  } catch {
    return null;
  }
}

/**
 * Hapus objek. Kegagalan sengaja ditelan: penghapusan foto tidak boleh
 * menggagalkan penghapusan anak/user di database.
 */
export async function deletePhoto(key: string): Promise<void> {
  const c = s3();
  if (!c) return;
  try {
    await c.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch {
    // Objek yatim lebih baik daripada aksi pengguna yang gagal.
  }
}

// Child photo
export const putChildPhoto = (childId: string, body: Uint8Array, ct: string) => putPhoto("children", childId, body, ct);
export const getChildPhoto = (key: string) => getPhoto(key);
export const deleteChildPhoto = deletePhoto;

// User photo
export const putUserPhoto = (userId: string, body: Uint8Array, ct: string) => putPhoto("users", userId, body, ct);
export const getUserPhoto = (key: string) => getPhoto(key);
