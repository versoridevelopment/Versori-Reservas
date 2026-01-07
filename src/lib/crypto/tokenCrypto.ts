import crypto from "crypto";

const ALG = "aes-256-gcm";

function getMasterKey(): Buffer {
  const b64 = process.env.MP_TOKEN_MASTER_KEY_B64 || "";
  if (!b64) throw new Error("Falta MP_TOKEN_MASTER_KEY_B64");
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) throw new Error("MP_TOKEN_MASTER_KEY_B64 debe ser 32 bytes (base64)");
  return key;
}

export function encryptToken(plain: string): { enc: string; iv: string; tag: string } {
  const key = getMasterKey();
  const iv = crypto.randomBytes(12); // recomendado para GCM
  const cipher = crypto.createCipheriv(ALG, key, iv);

  const encBuf = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    enc: encBuf.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

export function decryptToken(payload: { enc: string; iv: string; tag: string }): string {
  const key = getMasterKey();
  const iv = Buffer.from(payload.iv, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const enc = Buffer.from(payload.enc, "base64");

  const decipher = crypto.createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(tag);

  const plainBuf = Buffer.concat([decipher.update(enc), decipher.final()]);
  return plainBuf.toString("utf8");
}
