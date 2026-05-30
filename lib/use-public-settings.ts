"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Public settings read from the `settings` table where `is_public=true`.
// These mirror the keys editable on the admin /settings page.
export type PublicSettings = {
  hotel_name: string;
  hotel_tagline: string;
  hotel_address: string;
  contact_phone: string;
  contact_email: string;
  whatsapp_number: string;
  check_in_time: string;
  check_out_time: string;
};

// Sensible fallbacks shown while loading or if a key is empty.
const DEFAULTS: PublicSettings = {
  hotel_name: "Rathi Atithi Bhawan",
  hotel_tagline: "Comfort & Devotion in the Heart of Vrindavan",
  hotel_address: "Vrindavan, Mathura, Uttar Pradesh",
  contact_phone: "+91 90000 00000",
  contact_email: "stay@rathiatithibhawan.com",
  whatsapp_number: "919000000000",
  check_in_time: "12:00",
  check_out_time: "11:00",
};

const CACHE_KEY = "rab.public_settings.v1";
const CACHE_TTL_MS = 5 * 60 * 1000;

function readCache(): PublicSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { v: PublicSettings; t: number };
    if (Date.now() - parsed.t > 7 * 24 * 3600 * 1000) return null; // hard expiry 7d
    return parsed.v;
  } catch {
    return null;
  }
}

function writeCache(v: PublicSettings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ v, t: Date.now() })
    );
  } catch {
    // ignore (quota / private mode)
  }
}

function applyOverlay(base: PublicSettings, rows: { key: string; value: unknown }[]) {
  const out: PublicSettings = { ...base };
  for (const row of rows) {
    if (!(row.key in DEFAULTS)) continue;
    const v = row.value;
    // settings.value is jsonb. Strings/numbers come through as JS strings/numbers.
    if (typeof v === "string" && v.trim()) {
      (out as Record<string, string>)[row.key] = v;
    } else if (typeof v === "number") {
      (out as Record<string, string>)[row.key] = String(v);
    }
    // empty strings / null fall back to defaults
  }
  return out;
}

export function usePublicSettings(): PublicSettings {
  const [settings, setSettings] = useState<PublicSettings>(() => {
    const cached = readCache();
    return cached ? { ...DEFAULTS, ...cached } : DEFAULTS;
  });

  useEffect(() => {
    const cached = readCache();
    // Refetch in background if cache is older than TTL (or missing).
    const stale = !cached || true; // always refresh on mount; cheap query
    if (!stale) return;

    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("key, value")
        .eq("is_public", true);
      if (!active || error || !data) return;
      const next = applyOverlay(DEFAULTS, data);
      setSettings(next);
      writeCache(next);
    })();

    return () => {
      active = false;
    };
  }, []);

  return settings;
}

// Helpers for consistent link formatting
export function telHref(phone: string): string {
  // "+91 98765 43210" → "+919876543210"
  return `tel:${phone.replace(/\s+/g, "")}`;
}

export function waHref(whatsapp: string): string {
  // wa.me wants digits only
  return `https://wa.me/${whatsapp.replace(/\D/g, "")}`;
}

export function mailHref(email: string): string {
  return `mailto:${email}`;
}

// Format "HH:MM" as "12:00 PM"
export function formatTime12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (!Number.isFinite(h)) return hhmm;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${String(m ?? 0).padStart(2, "0")} ${period}`;
}
