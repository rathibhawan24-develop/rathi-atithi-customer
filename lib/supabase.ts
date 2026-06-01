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
export const GALLERY_PHOTOS_BUCKET = "gallery-photos";

/**
 * Build a public URL for a Supabase Storage object.
 * Supports both legacy single-arg form (assumes room-photos bucket) and the
 * preferred two-arg form (bucket, path).
 */
export function storagePublicUrl(
  pathOrBucket: string,
  maybePath?: string
): string {
  if (maybePath !== undefined) {
    if (!maybePath) return "";
    if (maybePath.startsWith("http")) return maybePath;
    return `${SUPABASE_URL}/storage/v1/object/public/${pathOrBucket}/${maybePath}`;
  }
  // Legacy single-arg form → defaults to ROOM_PHOTOS_BUCKET
  if (!pathOrBucket) return "";
  if (pathOrBucket.startsWith("http")) return pathOrBucket;
  return `${SUPABASE_URL}/storage/v1/object/public/${ROOM_PHOTOS_BUCKET}/${pathOrBucket}`;
}
