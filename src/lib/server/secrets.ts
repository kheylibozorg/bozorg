import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

/** Columns that never leave the server in plaintext — AES-256-GCM at rest in Neon. */
export const SECRET_SETTING_KEYS = [
  "lighter_api_key",
  "lighter_api_private_key",
  "aster_api_key",
  "aster_api_secret",
  "toobit_api_key",
  "toobit_api_secret",
  "hyperliquid_private_key",
] as const;

export type SecretSettingKey = (typeof SECRET_SETTING_KEYS)[number];

const PREFIX = "enc:v1:";

function keyMaterial(): Buffer {
  const ikm =
    typeof process !== "undefined" && process.env.DATABASE_URL?.trim()
      ? process.env.DATABASE_URL.trim()
      : "pglite-local";
  return Buffer.from(hkdfSync("sha256", ikm, "apex-desk", "neon-venue-secrets-v1", 32));
}

export function isSealedSecret(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(PREFIX);
}

export function sealSecret(plain: string): string {
  const text = plain.trim();
  if (!text) return "";
  if (isSealedSecret(text)) return text;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyMaterial(), iv);
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}.${tag.toString("base64url")}.${enc.toString("base64url")}`;
}

export function openSecret(value: string | null | undefined): string | null {
  if (value == null) return null;
  const raw = value.trim();
  if (!raw) return null;
  if (!isSealedSecret(raw)) return raw;
  const parts = raw.slice(PREFIX.length).split(".");
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    throw new Error("sealed secret is malformed");
  }
  const iv = Buffer.from(parts[0], "base64url");
  const tag = Buffer.from(parts[1], "base64url");
  const data = Buffer.from(parts[2], "base64url");
  const decipher = createDecipheriv("aes-256-gcm", keyMaterial(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function persistSecret(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s) return null;
  return sealSecret(s);
}
