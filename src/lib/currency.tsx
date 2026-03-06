import React, { useCallback, useEffect, useMemo, useState } from "react";

import { CURRENCY_STORAGE_KEY, CurrencyContext, type CurrencyCode, type CurrencyContextValue, USD_TO_INR } from "./currencyContext";

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    if (typeof window === "undefined") return "INR";
    const raw = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (raw === "INR") return raw;
    return "INR";
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    } catch {
      // ignore
    }
  }, [currency]);

  const setCurrency = useCallback((next: CurrencyCode) => {
    setCurrencyState(next);
  }, []);

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      setCurrency,
      usdToInrRate: USD_TO_INR,
    }),
    [currency, setCurrency]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}
