import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  // Handles both date-only ('YYYY-MM-DD') and timestamptz strings
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return format(parseISO(dateStr), "d MMM yyyy");
  }
  return format(new Date(dateStr), "d MMM yyyy");
}

export function todayIso(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function addDaysIso(dateStr: string, days: number): string {
  const d = parseISO(dateStr);
  d.setDate(d.getDate() + days);
  return format(d, "yyyy-MM-dd");
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = parseISO(checkIn);
  const b = parseISO(checkOut);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}
