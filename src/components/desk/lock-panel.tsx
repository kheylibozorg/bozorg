import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { lockDesk, setDeskPin, unlockDesk } from "@/lib/server/functions";
import { useLocale } from "@/lib/locale";

export function LockPanel({
  hasPin,
  unlocked,
}: {
  hasPin: boolean;
  unlocked: boolean;
}) {
  const { locale } = useLocale();
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fa = locale === "fa";

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      if (hasPin) await unlockDesk({ data: { pin } });
      else await setDeskPin({ data: { pin } });
      setPin("");
      await router.invalidate({ sync: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "failed");
    } finally {
      setBusy(false);
    }
  }

  async function lock() {
    setBusy(true);
    try {
      await lockDesk();
      await router.invalidate({ sync: true });
    } finally {
      setBusy(false);
    }
  }

  if (unlocked) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-long/30 bg-long-dim/40 p-4">
        <p className="text-sm text-fg">
          {fa
            ? "میز باز است. توکن کرون و کلیدها فقط برای تو دیده می‌شوند. قبل از بستن تب، قفل کن."
            : "Desk unlocked. Cron token and key hints are visible only in this session. Lock before sharing the link."}
        </p>
        <Button variant="outline" onClick={lock} disabled={busy}>
          {fa ? "قفل کردن" : "Lock"}
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-warn/40 bg-surface p-4 shadow-panel">
      <h2 className="font-medium">
        {hasPin
          ? fa
            ? "میز قفل است"
            : "Desk is locked"
          : fa
            ? "یک پین اپراتور بگذار"
            : "Set an operator PIN"}
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        {hasPin
          ? fa
            ? "لینک این میز عمومی است. بدون پین کسی نمی‌تواند کلید، توکن کرون، یا حالت زنده را عوض کند."
            : "This URL is public. Without the PIN nobody can change keys, the cron token, or live mode."
          : fa
            ? "الان هر کسی که لینک را داشته باشد می‌تواند همه چیز را عوض کند — از جمله چسباندن کلید API. حداقل ۶ کاراکتر. این پین را جای امن نگه دار."
            : "Right now anyone with this link can change everything — including pasting API keys. 6+ characters. Store it offline."}
      </p>
      <form
        className="mt-3 flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="grid min-w-48 flex-1 gap-1.5">
          <Label htmlFor="desk-pin">{fa ? "پین" : "PIN"}</Label>
          <Input
            id="desk-pin"
            type="password"
            autoComplete="current-password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder={fa ? "حداقل ۶ کاراکتر" : "6+ characters"}
          />
        </div>
        <Button type="submit" disabled={busy || pin.trim().length < 6}>
          {busy ? "…" : hasPin ? (fa ? "باز کردن" : "Unlock") : fa ? "ثبت پین" : "Set PIN"}
        </Button>
      </form>
      {err ? <p className="mt-2 text-sm text-short">{err}</p> : null}
    </div>
  );
}
