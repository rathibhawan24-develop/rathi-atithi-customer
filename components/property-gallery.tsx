"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase, storagePublicUrl } from "@/lib/supabase";

const ROTATE_MS = 2000;
const GALLERY_BUCKET = "gallery-photos";

type Photo = {
  id: string;
  storage_path: string;
  caption: string | null;
};

export function PropertyGallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  // Fetch photos on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("gallery_photos")
        .select("id, storage_path, caption")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (!mounted) return;
      if (error || !data) {
        setLoading(false);
        return;
      }
      setPhotos(data);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-rotate
  useEffect(() => {
    if (paused || photos.length <= 1) return;
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % photos.length);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [paused, photos.length]);

  if (loading || photos.length === 0) return null;

  const prev = () => setIdx((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx((i) => (i + 1) % photos.length);

  return (
    <div
      className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden rounded-2xl bg-secondary/30 border border-border shadow-sm group"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setTimeout(() => setPaused(false), 3000)}
    >
      {photos.map((p, i) => (
        <div
          key={p.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-700 ease-in-out",
            i === idx ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          aria-hidden={i !== idx}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={storagePublicUrl(GALLERY_BUCKET, p.storage_path)}
            alt={p.caption ?? `Property photo ${i + 1}`}
            className="h-full w-full object-cover"
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
          />
          {p.caption && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4 sm:p-6">
              <p className="text-white text-sm sm:text-base font-medium drop-shadow">
                {p.caption}
              </p>
            </div>
          )}
        </div>
      ))}

      {photos.length > 1 && (
        <>
          {/* Arrows */}
          <button
            type="button"
            onClick={prev}
            aria-label="Previous photo"
            className="absolute top-1/2 left-2 sm:left-3 -translate-y-1/2 h-10 w-10 rounded-full bg-white/85 hover:bg-white text-foreground shadow-md flex items-center justify-center backdrop-blur-sm transition-opacity opacity-0 group-hover:opacity-100 sm:opacity-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next photo"
            className="absolute top-1/2 right-2 sm:right-3 -translate-y-1/2 h-10 w-10 rounded-full bg-white/85 hover:bg-white text-foreground shadow-md flex items-center justify-center backdrop-blur-sm transition-opacity opacity-0 group-hover:opacity-100 sm:opacity-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                aria-label={`Go to photo ${i + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === idx
                    ? "w-6 bg-white"
                    : "w-1.5 bg-white/60 hover:bg-white/80"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
