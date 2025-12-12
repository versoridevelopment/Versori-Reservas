// src/lib/storage/uploadCanchaImage.ts
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

const BUCKET = "public-media";

function safeFileExt(file: File) {
  // Intenta tomar extensión del nombre
  const name = file.name || "";
  const lastDot = name.lastIndexOf(".");
  if (lastDot > -1 && lastDot < name.length - 1) {
    const ext = name.slice(lastDot + 1).toLowerCase().replace(/[^a-z0-9]/g, "");
    if (ext) return ext;
  }

  // Fallback por mimetype
  const type = (file.type || "").toLowerCase();
  if (type.includes("png")) return "png";
  if (type.includes("jpeg") || type.includes("jpg")) return "jpg";
  if (type.includes("webp")) return "webp";
  if (type.includes("gif")) return "gif";

  // Último recurso
  return "jpg";
}

export function buildCanchaImagePath(id_club: number, file: File) {
  const ext = safeFileExt(file);
  // IMPORTANTE: tu bucket está organizado por club_7/canchas/...
  return `club_${id_club}/canchas/${crypto.randomUUID()}.${ext}`;
}

export function extractPathFromPublicUrl(publicUrl: string, bucket = BUCKET) {
  // Esperado:
  // https://xxxx.supabase.co/storage/v1/object/public/public-media/club_7/canchas/uuid.jpg
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;

  const path = publicUrl.substring(idx + marker.length);
  // decode por si hay espacios u otros caracteres codificados
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

export async function uploadCanchaImage(params: { id_club: number; file: File }) {
  const { id_club, file } = params;

  const path = buildCanchaImagePath(id_club, file);

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type || "image/jpeg",
      cacheControl: "3600",
    });

  if (uploadError) {
    console.error("[uploadCanchaImage] uploadError:", uploadError);
    throw new Error("Error subiendo imagen de cancha");
  }

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

  return {
    bucket: BUCKET,
    path,
    publicUrl: data.publicUrl,
  };
}
