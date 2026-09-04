import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { getSql } from "@/lib/db";
import { getSettings } from "./desk.server";

const COOKIE = "apex_op";
const MAX_AGE = 60 * 60 * 24 * 14;

function hashPin(pin: string, salt: string) {
  return scryptSync(pin, salt, 32).toString("hex");
}

function safeEqualHex(a: string, b: string) {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ba.length !== bb.length || ba.length === 0) return false;
  return timingSafeEqual(ba, bb);
}

function writeSessionCookie(session: string) {
  setCookie(COOKIE, session, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
    secure: process.env.VERCEL === "1",
  });
}

export async function lockStatus() {
  const row = await getSettings();
  const hasPin = Boolean(row.operator_pin_hash);
  const cookie = getCookie(COOKIE) ?? "";
  const unlocked = Boolean(hasPin && row.operator_session && cookie && cookie === row.operator_session);
  return { hasPin, unlocked };
}

export async function requireOperator() {
  const s = await lockStatus();
  if (!s.hasPin) {
    throw new Error("Set an operator PIN first. Anyone with this link could change the desk until you do.");
  }
  if (!s.unlocked) {
    throw new Error("Desk is locked. Unlock with your PIN to change settings or see the cron token.");
  }
}

export async function setOperatorPin(pin: string) {
  const trimmed = pin.trim();
  if (trimmed.length < 6 || trimmed.length > 64) {
    throw new Error("PIN must be 6–64 characters.");
  }
  const current = await lockStatus();
  if (current.hasPin && !current.unlocked) {
    throw new Error("Unlock the current PIN before replacing it.");
  }
  const salt = randomBytes(16).toString("hex");
  const hash = hashPin(trimmed, salt);
  const session = randomBytes(24).toString("hex");
  const sql = await getSql();
  await sql`
    update desk_settings
    set operator_pin_hash = ${hash},
        operator_pin_salt = ${salt},
        operator_session = ${session},
        updated_at = now()
    where id = 1
  `;
  writeSessionCookie(session);
  return { hasPin: true, unlocked: true };
}

export async function unlockOperator(pin: string) {
  const row = await getSettings();
  if (!row.operator_pin_hash || !row.operator_pin_salt) {
    throw new Error("No PIN set yet.");
  }
  const got = hashPin(pin.trim(), row.operator_pin_salt);
  if (!safeEqualHex(got, row.operator_pin_hash)) {
    throw new Error("Wrong PIN.");
  }
  const session = randomBytes(24).toString("hex");
  const sql = await getSql();
  await sql`update desk_settings set operator_session = ${session}, updated_at = now() where id = 1`;
  writeSessionCookie(session);
  return { hasPin: true, unlocked: true };
}

export async function lockOperator() {
  deleteCookie(COOKIE, { path: "/" });
  return { locked: true };
}
