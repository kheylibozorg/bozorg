import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BookOpen,
  LineChart,
  Globe,
  LayoutDashboard,
  Radio,
  ShieldCheck,
  Waypoints,
} from "lucide-react";
import { useLocale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", key: "desk" as const, icon: LayoutDashboard },
  { to: "/signals", key: "signals" as const, icon: Activity },
  { to: "/journal", key: "journal" as const, icon: BookOpen },
  { to: "/backtest", key: "backtest" as const, icon: LineChart },
  { to: "/universe", key: "universe" as const, icon: Globe },
  { to: "/venues", key: "venues" as const, icon: Waypoints },
  { to: "/always-on", key: "alwaysOn" as const, icon: Radio },
  { to: "/audit", key: "audit" as const, icon: ShieldCheck },
];

export function DeskShell({
  children,
  status,
}: {
  children: ReactNode;
  status?: ReactNode;
}) {
  const { t, locale, setLocale } = useLocale();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(1200px_circle_at_10%_-10%,color-mix(in_oklab,var(--color-long)_12%,transparent),transparent_55%)]" />
      <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 place-items-center rounded-sm border border-border bg-surface">
              <span className="font-display text-lg leading-none text-long">A</span>
            </span>
            <span className="min-w-0">
              <span className="block font-display text-lg leading-tight tracking-tight">{t.brand}</span>
              <span className="hidden text-xs text-muted sm:block">{t.tagline}</span>
            </span>
          </Link>
          <div className="ms-auto flex items-center gap-2">
            {status}
            <button
              type="button"
              className="h-11 rounded-sm border border-border px-3 text-xs text-muted hover:text-fg"
              onClick={() => setLocale(locale === "fa" ? "en" : "fa")}
            >
              {locale === "fa" ? "EN" : "فا"}
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 pb-2 sm:px-6">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex h-10 shrink-0 items-center gap-2 rounded-sm px-3 text-sm transition-colors",
                  active ? "bg-surface text-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
                )}
              >
                <Icon className="size-4" strokeWidth={1.75} />
                {t[item.key]}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="relative mx-auto min-w-0 max-w-7xl overflow-x-clip px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
