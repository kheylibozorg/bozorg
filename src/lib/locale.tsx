import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { copy, type Copy, type Locale } from "./i18n";

const Ctx = createContext<{
  locale: Locale;
  t: Copy;
  setLocale: (l: Locale) => void;
} | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fa");
  useEffect(() => {
    const saved = localStorage.getItem("apex-locale");
    if (saved === "en" || saved === "fa") setLocaleState(saved);
  }, []);
  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("apex-locale", l);
    document.documentElement.lang = l === "fa" ? "fa" : "en";
    document.documentElement.dir = l === "fa" ? "rtl" : "ltr";
  };
  useEffect(() => {
    document.documentElement.lang = locale === "fa" ? "fa" : "en";
    document.documentElement.dir = locale === "fa" ? "rtl" : "ltr";
  }, [locale]);
  const value = useMemo(() => ({ locale, t: copy[locale], setLocale }), [locale]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocale() {
  const v = useContext(Ctx);
  if (!v) throw new Error("LocaleProvider missing");
  return v;
}
