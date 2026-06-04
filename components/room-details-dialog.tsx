"use client";

import { useEffect, useState, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  BedDouble,
  Check,
} from "lucide-react";
import { storagePublicUrl } from "@/lib/supabase";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Room } from "@/types";

/**
 * Full-detail popup for a room — photos, description, capacity, amenities,
 * and a one-click select action. Triggered from the "View details" button
 * on RoomCard, or by clicking the card photo.
 *
 * Closes on:
 *   - X button
 *   - clicking the dark backdrop outside the card
 *   - pressing Escape
 *
 * Arrow keys flip between photos when there's more than one.
 */
export function RoomDetailsDialog({
  room,
  open,
  onClose,
  onSelect,
  isSelected,
}: {
  room: Room;
  open: boolean;
  onClose: () => void;
  onSelect: () => void;
  isSelected: boolean;
}) {
  const photos = Array.isArray(room.photos) ? room.photos : [];
  const amenities = Array.isArray(room.amenities) ? room.amenities : [];
  const [photoIdx, setPhotoIdx] = useState(0);

  // Reset to first photo every time the dialog opens
  useEffect(() => {
    if (open) setPhotoIdx(0);
  }, [open]);

  const prev = useCallback(() => {
    if (photos.length === 0) return;
    setPhotoIdx((i) => (i - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const next = useCallback(() => {
    if (photos.length === 0) return;
    setPhotoIdx((i) => (i + 1) % photos.length);
  }, [photos.length]);

  // Keyboard nav + scroll lock while open
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

  if (!open) return null;

  const currentPhoto = photos[photoIdx]
    ? storagePublicUrl(photos[photoIdx])
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-details-title"
    >
      <div
        className="relative bg-card rounded-2xl shadow-2xl w-full max-w-3xl my-4 sm:my-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button — floats on top of the photo */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-background/95 backdrop-blur border flex items-center justify-center hover:bg-background transition"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Photo carousel */}
        <div className="relative aspect-[16/10] bg-gradient-to-br from-primary/10 to-accent/30 select-none">
          {currentPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentPhoto}
              alt={`${room.name} — photo ${photoIdx + 1}`}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BedDouble className="h-16 w-16 text-primary/30" />
            </div>
          )}

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/90 border flex items-center justify-center hover:bg-background transition"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/90 border flex items-center justify-center hover:bg-background transition"
                aria-label="Next photo"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Photo indicators */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPhotoIdx(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === photoIdx
                        ? "w-6 bg-white"
                        : "w-1.5 bg-white/50 hover:bg-white/80"
                    )}
                    aria-label={`Photo ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Title + price */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2
                id="room-details-title"
                className="font-display text-2xl sm:text-3xl tracking-tight leading-tight"
              >
                {room.name}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Room #{room.room_number} · {room.room_type}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-display text-2xl sm:text-3xl font-semibold tabular-nums">
                {formatCurrency(Number(room.base_price))}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                per night
              </p>
            </div>
          </div>

          {/* Capacity chips */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
              <Users className="h-3.5 w-3.5" />
              Sleeps up to {room.max_occupancy}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
              <BedDouble className="h-3.5 w-3.5" />
              Base for {room.base_occupancy}
              {room.extra_capacity > 0
                ? ` (+${room.extra_capacity} extra)`
                : ""}
            </span>
          </div>

          {/* Description */}
          {room.description && (
            <div>
              <h3 className="font-medium text-sm uppercase tracking-wider text-muted-foreground mb-2">
                About this room
              </h3>
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {room.description}
              </p>
            </div>
          )}

          {/* Amenities */}
          {amenities.length > 0 && (
            <div>
              <h3 className="font-medium text-sm uppercase tracking-wider text-muted-foreground mb-3">
                Amenities
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
                {amenities.map((a) => (
                  <div key={a} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-4 border-t flex flex-wrap gap-2 items-center justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              type="button"
              variant={isSelected ? "secondary" : "default"}
              onClick={() => {
                onSelect();
                onClose();
              }}
            >
              {isSelected ? "Remove from booking" : "Select this room"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
