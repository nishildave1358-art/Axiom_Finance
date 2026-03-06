import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, _currency: string = "INR"): string {
  const locale = "en-IN";
  const minimumFractionDigits = 2;
  const maximumFractionDigits = 2;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "INR",
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}

export function smartFormat(value: number, currency: string = "INR"): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (abs >= 1_000_000) {
    const lakhs = abs / 100_000;
    return `${sign}${lakhs.toFixed(1)}L`;
  }

  if (abs < 1_000) {
    return formatCurrency(value, currency);
  }

  const locale = "en-IN";
  return `${sign}${new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(abs)}`;
}

export function formatDays(days: number): string {
  if (days === 0) return '0 days';
  if (days < 30) return `${days} days`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    if (remainingDays === 0) return `${months} month${months > 1 ? 's' : ''}`;
    return `${months}m ${remainingDays}d`;
  }
  const years = Math.floor(days / 365);
  const remainingDays = days % 365;
  if (remainingDays === 0) return `${years} year${years > 1 ? 's' : ''}`;
  const months = Math.floor(remainingDays / 30);
  return `${years}y ${months}m`;
}
