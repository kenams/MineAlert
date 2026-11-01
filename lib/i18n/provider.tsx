"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { createT, type TranslateFn } from "./index";
import { DEFAULT_LOCALE, type Locale } from "./locale";

type LocaleContextValue = {
  locale: Locale;
  t: TranslateFn;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  t: createT(DEFAULT_LOCALE),
});

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}): JSX.Element {
  const value = useMemo(() => ({ locale, t: createT(locale) }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext).locale;
}

export function useT(): TranslateFn {
  return useContext(LocaleContext).t;
}
