"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Users, Bed } from "lucide-react";
import { storagePublicUrl } from "@/lib/supabase";
import { formatCurrency, cn } from "@/lib/utils";

export type CarouselSlide = {
  id: string;
  photoPath: string | null;
  title: string;
  subtitle: string;
  price: number;
  capacity: number;
};

const ROTATE_MS = 4500;

export function RoomCarousel({ slides }: { slides: CarouselSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const router = useRouter();

  // Auto-advance — paused on hover or focus, and respects reduced-motion.
  useEffect(() => {
    if (slides.length <= 1 || paused) return;
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
  }, [slides.length, paused]);

  const handleClick = useCallback(() => {
    router.push("/book");
  }, [router]);

  if (slides.length === 0) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-label="Browse rooms and book"
      className="relative rounded-2xl overflow-hidden shadow-xl group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9] bg-muted">
        {slides.map((slide, i) => {
          const isActive = i === index;
          const photoUrl = slide.photoPath
            ? storagePublicUrl(slide.photoPath)
            : null;
          return (
            <div
              key={slide.id}
              className={cn(
                "absolute inset-0 transition-opacity duration-700 ease-in-out",
                isActive ? "opacity-100 z-10" : "opacity-0 z-0"
              )}
              aria-hidden={!isActive}
            >
              {photoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={photoUrl}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                  loading={i === 0 ? "eager" : "lazy"}
                />
              ) : (
                <PlaceholderSlide index={i} />
              )}

              {/* Bottom gradient for text contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

              {/* Slide content */}
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

      {/* Prev/Next arrows */}
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
                i === index ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
              )}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Book now pill */}
      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20 inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground text-[11px] sm:text-xs font-medium pl-3 pr-2 py-1.5 shadow-md">
        Book now
        <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
      </div>
    </div>
  );
}

function PlaceholderSlide({ index }: { index: number }) {
  // Vary gradient direction + warm-palette pairings so consecutive slides
  // look distinct even without real photos.
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
