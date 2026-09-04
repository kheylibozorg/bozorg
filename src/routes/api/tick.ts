import { createFileRoute } from "@tanstack/react-router";
import { getSettings } from "@/lib/server/desk.server";
import { runTick } from "@/lib/server/tick.server";

function bearerOrQuery(request: Request) {
  const url = new URL(request.url);
  return (
    url.searchParams.get("token") ??
    request.headers.get("x-cron-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    ""
  );
}

function isPlaceholder(token: string | null | undefined) {
  const t = (token ?? "").trim();
  return !t || t === "change-me";
}

function authorized(token: string, expected: string) {
  const envSecret = typeof process !== "undefined" ? process.env.CRON_SECRET : undefined;
  if (envSecret && !isPlaceholder(envSecret) && token && token === envSecret) return true;
  // Never trust a spoofable x-vercel-cron header. Vercel sends CRON_SECRET as Bearer
  // when it is set. Cloudflare / cron-job.org must use the rotated desk token.
  if (isPlaceholder(expected) || isPlaceholder(token)) return false;
  return token === expected;
}

function cronSource(request: Request) {
  const header = request.headers.get("x-cron-source");
  if (header) return header.slice(0, 32);
  if (request.headers.get("x-vercel-cron")) return "vercel";
  const ua = request.headers.get("user-agent") ?? "";
  if (/cron-job\.org/i.test(ua)) return "backup";
  return "cron";
}

export const Route = createFileRoute("/api/tick")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = bearerOrQuery(request);
        const settings = await getSettings();
        if (!authorized(token, settings.tick_token)) {
          return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
        }
        const url = new URL(request.url);
        const result = await runTick({
          forceUniverse: url.searchParams.get("universe") === "1",
          source: cronSource(request),
        });
        return Response.json(result);
      },
      POST: async ({ request }) => {
        const token = bearerOrQuery(request);
        const settings = await getSettings();
        if (!authorized(token, settings.tick_token)) {
          return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
        }
        const result = await runTick({ source: cronSource(request) });
        return Response.json(result);
      },
    },
  },
});
