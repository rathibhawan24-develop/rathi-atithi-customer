"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Users, Bed, Images } from "lucide-react";
import { storagePublicUrl } from "@/lib/supabase";
import { formatCurrency, cn } from "@/lib/utils";
import { Lightbox } from "@/components/lightbox";

export type CarouselSlide = {
  id: string;
  photos: string[]; // every photo across all rooms of this type
  title: string;
  subtitle: string;
  price: number;
  capacity: number;
};

const ROTATE_MS = 4500;

export function RoomCarousel({ slides }: { slides: CarouselSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const router = useRouter();

  // Auto-advance — paused on hover/focus, while the lightbox is open, and when
  // the user prefers reduced motion.
  useEffect(() => {
    if (slides.length <= 1 || paused || lightboxOpen) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, ROTATE_MS);
    return () => clearInterval(t);
  }, [slides.length, paused, lightboxOpen]);

  const current = slides[index];

  // Click on the image: open the gallery if this type has photos, otherwise
  // just send them to booking (nothing to show in a gallery).
  const handleImageClick = useCallback(() => {
    if (current && current.photos.length > 0) {
      setLightboxOpen(true);
    } else {
      router.push("/book");
    }
  }, [current, router]);

  if (slides.length === 0) return null;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleImageClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleImageClick();
          }
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        aria-label={
          current.photos.length > 0
            ? `View ${current.title} photos`
            : "Browse rooms and book"
        }
        className="relative rounded-2xl overflow-hidden shadow-xl group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <div className="relative aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9] bg-muted">
          {slides.map((slide, i) => {
            const isActive = i === index;
            const cover = slide.photos[0] ?? null;
            return (
              <div
                key={slide.id}
                className={cn(
                  "absolute inset-0 transition-opacity duration-700 ease-in-out",
                  isActive ? "opacity-100 z-10" : "opacity-0 z-0"
                )}
                aria-hidden={!isActive}
              >
                {cover ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={storagePublicUrl(cover)}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                    loading={i === 0 ? "eager" : "lazy"}
                  />
                ) : (
                  <PlaceholderSlide index={i} />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

                <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8 md:p-10 text-white">
                  <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] font-medium opacity-90 mb-1 sm:mb-2">
                    {slide.subtitle}
                  </p>
                  <h3 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tight leading-tight">
                    {slide.title}
                  </h3>
                  <div className="flex items-end justify-between mt-3 sm:mt-4 gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-sm opacity-95">
                      <Users className="h-4 w-4" />
                      Sleeps {slide.capacity}
                    </span>
                    <div className="text-right">
                      <span className="text-[10px] uppercase opacity-80 tracking-wider mr-2">
                        From
                      </span>
                      <span className="font-display text-xl sm:text-2xl font-semibold tabular-nums">
                        {formatCurrency(slide.price)}
                      </span>
                      <span className="text-xs opacity-80 ml-1">/night</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Arrows */}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIndex((i) => (i - 1 + slides.length) % slides.length);
              }}
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white/85 backdrop-blur shadow-md hover:bg-white transition-colors flex items-center justify-center"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIndex((i) => (i + 1) % slides.length);
              }}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white/85 backdrop-blur shadow-md hover:bg-white transition-colors flex items-center justify-center"
              aria-label="Next slide"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
            </button>
          </>
        )}

        {/* Dots */}
        {slides.length > 1 && (
          <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 z-20 flex gap-1.5 bg-black/30 backdrop-blur px-2.5 py-1.5 rounded-full">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex(i);
                }}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index
                    ? "w-5 bg-white"
                    : "w-1.5 bg-white/50 hover:bg-white/80"
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Top-left: photo-count chip when this type has photos to browse */}
        {current.photos.length > 0 && (
          <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-20 inline-flex items-center gap-1.5 rounded-full bg-black/45 backdrop-blur text-white text-[11px] sm:text-xs font-medium px-3 py-1.5">
            <Images className="h-3.5 w-3.5" />
            {current.photos.length} photo{current.photos.length === 1 ? "" : "s"}
          </div>
        )}

        {/* Book now pill — explicit, stops propagation so it always books */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            router.push("/book");
          }}
          className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20 inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground text-[11px] sm:text-xs font-medium pl-3 pr-2 py-1.5 shadow-md hover:bg-primary/90 transition-colors"
        >
          Book now
          <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        </button>
      </div>

      <Lightbox
        photos={current.photos}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        title={current.title}
      />
    </>
  );
}

function PlaceholderSlide({ index }: { index: number }) {
  const variants = [
    "bg-gradient-to-br from-primary/40 via-accent/40 to-secondary",
    "bg-gradient-to-tr from-accent/60 via-primary/25 to-secondary",
    "bg-gradient-to-tl from-secondary via-accent/40 to-primary/30",
    "bg-gradient-to-bl from-primary/30 via-secondary to-accent/50",
  ];
  return (
    <div
      className={cn(
        "w-full h-full flex items-center justify-center",
        variants[index % variants.length]
      )}
    >
      <Bed
        className="h-20 w-20 sm:h-28 sm:w-28 text-primary/40"
        strokeWidth={1.5}
      />
    </div>
  );
}
