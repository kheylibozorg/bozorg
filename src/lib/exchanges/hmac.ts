import { createHmac } from "node:crypto";

export function hmacSha256Hex(secret: string, payload: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function signedQuery(params: Record<string, string | number | undefined>, secret: string) {
  const body = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  const signature = hmacSha256Hex(secret, body);
  return { body, signature, qs: `${body}&signature=${signature}` };
}
