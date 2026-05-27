import { createClient } from "@supabase/supabase-js";

// These are public values (the anon key is meant to be exposed). RLS policies
// in the database restrict what anonymous callers can actually do. Override via
// env vars at build time if needed.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://xeqjrgsciqafiywiozum.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlcWpyZ3NjaXFhZml5d2lvenVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NjA3OTYsImV4cCI6MjA5NTQzNjc5Nn0.Axml6CMJuTp9SE1HRu9oNMMVjwazCXzc4rS-JA5i64I";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

export const ROOM_PHOTOS_BUCKET = "room-photos";

export function storagePublicUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/${ROOM_PHOTOS_BUCKET}/${path}`;
}
