"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { storagePublicUrl } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export function Lightbox({
  photos,
  open,
  onClose,
  initialIndex = 0,
  title,
}: {
  photos: string[];
  open: boolean;
  onClose: () => void;
  initialIndex?: number;
  title?: string;
}) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [initialIndex, open]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, prev, next]);

  if (!open || photos.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title ? `${title} photos` : "Photo gallery"}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 text-white shrink-0">
        <div className="text-sm min-w-0">
          {title && <span className="font-medium">{title}</span>}
          {photos.length > 1 && (
            <span className="ml-2 opacity-70 tabular-nums">
              {index + 1} / {photos.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="h-10 w-10 inline-flex items-center justify-center rounded-full hover:bg-white/10 transition-colors shrink-0"
          aria-label="Close gallery"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Main image */}
      <div className="flex-1 flex items-center justify-center px-4 pb-2 min-h-0 relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={storagePublicUrl(photos[index])}
          alt={title ?? "Photo"}
          className="max-w-full max-h-full object-contain rounded-lg select-none"
          onClick={(e) => e.stopPropagation()}
        />

        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur transition-colors"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur transition-colors"
              aria-label="Next photo"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div
          className="shrink-0 px-4 pb-4 pt-1 flex gap-2 justify-start sm:justify-center overflow-x-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {photos.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={cn(
                "h-12 w-16 sm:h-14 sm:w-20 rounded-md overflow-hidden shrink-0 border-2 transition-all",
                i === index
                  ? "border-white"
                  : "border-transparent opacity-50 hover:opacity-100"
              )}
              aria-label={`View photo ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={storagePublicUrl(p)}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
