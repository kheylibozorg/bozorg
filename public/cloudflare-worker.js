/**
 * Apex Desk — Cloudflare Cron Worker (free)
 *
 * Dashboard setup (no CLI needed):
 * 1. dash.cloudflare.com → Workers & Pages → Create Worker
 * 2. Paste this file
 * 3. Settings → Variables and Secrets
 *      DESK_URL   = https://YOUR-APP.vercel.app   (published URL, not localhost)
 *      DESK_TOKEN = the cron token from Always-on
 * 4. Triggers → Cron Triggers → * * * * *  (every minute)
 * 5. Save and Deploy
 *
 * Free plan allows one cron per minute. Keep the trigger at * * * * *.
 * Cloudflare sometimes fires 1–2 minutes late — the desk only fills the
 * latest closed bar while it is still fresh, and continues the universe
 * sweep on the next ping. Never trades a forming candle or the previous one.
 * Add a free cron-job.org backup hitting the same /api/tick URL with
 * Authorization: Bearer DESK_TOKEN (never put the token in the query string).
 */
export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(pingDesk(env));
  },
  async fetch(_request, env) {
    const result = await pingDesk(env);
    return new Response(JSON.stringify(result, null, 2), {
      status: result.ok ? 200 : 502,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  },
};

async function pingDesk(env, attempt = 0) {
  const base = String(env.DESK_URL || "").replace(/\/$/, "");
  const token = String(env.DESK_TOKEN || "");
  if (!base || !token) {
    return { ok: false, error: "DESK_URL and DESK_TOKEN must be set" };
  }
  const url = `${base}/api/tick`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "x-cron-source": "cloudflare",
        authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(55_000),
    });
    const text = await res.text();
    let body = text;
    try {
      body = JSON.parse(text);
    } catch {
      /* keep text */
    }
    if (!res.ok) {
      if (attempt < 2 && res.status >= 500) {
        await sleep(1200 * (attempt + 1));
        return pingDesk(env, attempt + 1);
      }
      console.error("apex tick failed", res.status, text);
      return { ok: false, status: res.status, body };
    }
    console.log("apex tick", body);
    return { ok: true, status: res.status, body };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (attempt < 2) {
      await sleep(1200 * (attempt + 1));
      return pingDesk(env, attempt + 1);
    }
    console.error("apex tick error", message);
    return { ok: false, error: message };
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
