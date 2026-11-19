"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale } from "./i18n";
import { dictionaries } from "./i18n";

type LocaleState = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggle: () => void;
};

export const useLocale = create<LocaleState>()(
  persist(
    (set, get) => ({
      locale: "id",
      setLocale: (locale) => set({ locale }),
      toggle: () => set({ locale: get().locale === "id" ? "en" : "id" }),
    }),
    { name: "lyra.locale" }
  )
);

export function useT() {
  const locale = useLocale((s) => s.locale);
  const t = (key: string) => dictionaries[locale][key] ?? key;
  return { t, locale };
}

export function useL() {
  const locale = useLocale((s) => s.locale);
  const l = (v: { id: string; en: string }) => v[locale];
  return { l, locale };
}
