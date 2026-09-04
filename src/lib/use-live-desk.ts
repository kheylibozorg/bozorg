import { useRouter } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { tickNow } from "@/lib/server/functions";

type RouterApi = ReturnType<typeof useRouter>;

/** Reload loaders without sending the viewport back to the top. */
function invalidateQuiet(router: RouterApi, opts?: { sync?: boolean }) {
  const scroll = (router as RouterApi & { _scroll?: { next: boolean } })._scroll;
  if (scroll) scroll.next = false;
  const x = window.scrollX;
  const y = window.scrollY;
  return router.invalidate(opts).finally(() => {
    if (window.scrollX === x && window.scrollY === y) return;
    window.scrollTo(x, y);
    requestAnimationFrame(() => window.scrollTo(x, y));
  });
}

/** Keep the desk in sync with server-side cron fills while the page is open. */
export function useLiveDesk(ms = 20000) {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => {
      void invalidateQuiet(router);
    }, ms);
    return () => window.clearInterval(id);
  }, [router, ms]);
}

/**
 * If Cloudflare is late and this tab is open + unlocked, fire a catch-up tick.
 * Browser-closed trading still depends on Cloudflare / cron-job.org.
 */
export function useCronWatchdog(opts: { enabled: boolean; lastTickAt: string | null }) {
  const router = useRouter();
  const lastTickAt = opts.lastTickAt;
  const running = useRef(false);
  useEffect(() => {
    if (!opts.enabled) return;
    const id = window.setInterval(() => {
      if (running.current) return;
      const last = lastTickAt ? new Date(lastTickAt).getTime() : 0;
      if (last && Date.now() - last < 80_000) return;
      running.current = true;
      void tickNow({ data: { source: "watchdog" } })
        .then(() => invalidateQuiet(router))
        .catch(() => undefined)
        .finally(() => {
          running.current = false;
        });
    }, 60_000);
    return () => window.clearInterval(id);
  }, [opts.enabled, lastTickAt, router]);
}
