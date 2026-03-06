import { createContext } from "react";

export type CurrencyCode = "INR";

export const CURRENCY_STORAGE_KEY = "fp_currency";
export const USD_TO_INR = 83.5;

export interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  usdToInrRate: number;
}

export const CurrencyContext = createContext<CurrencyContextValue | null>(null);
