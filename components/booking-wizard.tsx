"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Users,
  BedDouble,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  Copy,
  Sparkles,
  AlertCircle,
  Minus,
  Plus,
  Images,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, Textarea, Card, CardContent } from "@/components/ui/primitives";
import { Lightbox } from "@/components/lightbox";
import { supabase, storagePublicUrl } from "@/lib/supabase";
import {
  formatCurrency,
  todayIso,
  addDaysIso,
  nightsBetween,
  formatDate,
  cn,
} from "@/lib/utils";
import type { Room, Addon } from "@/types";

type Step = 1 | 2 | 3 | 4 | 5;

type SelectedRoom = {
  roomId: string;
  guests: number;
  addons: Record<string, number>;
};

const MAX_DAYS_AHEAD = 180;

export function BookingWizard() {
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [checkIn, setCheckIn] = useState(todayIso());
  const [checkOut, setCheckOut] = useState(addDaysIso(todayIso(), 1));

  // Step 2 data — only available rooms (booked rooms hidden).
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [availableAddons, setAvailableAddons] = useState<Addon[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState<Record<string, SelectedRoom>>(
    {}
  );

  // Step 3
  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  // Step 4
  const [submitting, setSubmitting] = useState(false);
  const [bookingCode, setBookingCode] = useState<string | null>(null);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    return Math.max(0, nightsBetween(checkIn, checkOut));
  }, [checkIn, checkOut]);

  const totals = useMemo(() => {
    const rows = Object.values(selectedRooms);
    let roomsSub = 0;
    let addonsSub = 0;
    for (const sel of rows) {
      const room = availableRooms.find((r) => r.id === sel.roomId);
      if (!room) continue;
      roomsSub += Number(room.base_price) * nights;
      for (const [addonId, qty] of Object.entries(sel.addons)) {
        const addon = availableAddons.find((a) => a.id === addonId);
        if (!addon || qty <= 0) continue;
        addonsSub +=
          Number(addon.price) * qty * (addon.is_per_night ? nights : 1);
      }
    }
    return { roomsSub, addonsSub, total: roomsSub + addonsSub };
  }, [selectedRooms, availableRooms, availableAddons, nights]);

  const selectedRoomCount = Object.keys(selectedRooms).length;

  // ----- Step 1: validate dates and fetch availability -----
  const handleStep1Next = async (
    overrideCheckIn?: string,
    overrideCheckOut?: string
  ) => {
    setError(null);
    const ci = overrideCheckIn ?? checkIn;
    const co = overrideCheckOut ?? checkOut;

    if (!ci || !co) {
      setError("Please pick check-in and check-out dates.");
      return;
    }
    const localNights = nightsBetween(ci, co);
    if (localNights < 1) {
      setError("Check-out must be after check-in.");
      return;
    }
    if (ci < todayIso()) {
      setError("Check-in date cannot be in the past.");
      return;
    }
    if (ci > addDaysIso(todayIso(), MAX_DAYS_AHEAD)) {
      setError(`Bookings can only be made up to ${MAX_DAYS_AHEAD} days ahead.`);
      return;
    }

    setLoadingRooms(true);
    const [roomsRes, addonsRes] = await Promise.all([
      supabase.rpc("get_available_rooms", {
        p_check_in: ci,
        p_check_out: co,
      }),
      supabase
        .from("addons")
        .select("*")
        .eq("is_active", true)
        .order("display_order"),
    ]);
    setLoadingRooms(false);

    if (roomsRes.error) {
      setError(roomsRes.error.message);
      return;
    }
    setAvailableRooms((roomsRes.data ?? []) as Room[]);
    setAvailableAddons((addonsRes.data ?? []) as Addon[]);
    setSelectedRooms({});
    setStep(2);
  };

  // Auto-advance from URL params (?checkIn=...&checkOut=...) — used when
  // landing from the hero search on the home page.
  const autoAdvancedRef = useRef(false);
  useEffect(() => {
    if (autoAdvancedRef.current) return;
    autoAdvancedRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const ci = params.get("checkIn");
    const co = params.get("checkOut");
    if (
      ci &&
      co &&
      /^\d{4}-\d{2}-\d{2}$/.test(ci) &&
      /^\d{4}-\d{2}-\d{2}$/.test(co) &&
      ci >= todayIso() &&
      ci < co
    ) {
      setCheckIn(ci);
      setCheckOut(co);
      handleStep1Next(ci, co);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- Step 2: room selection -----
  const toggleRoom = (room: Room) => {
    setSelectedRooms((prev) => {
      const next = { ...prev };
      if (next[room.id]) {
        delete next[room.id];
      } else {
        next[room.id] = { roomId: room.id, guests: 1, addons: {} };
      }
      return next;
    });
  };

  const setRoomGuests = (roomId: string, guests: number) => {
    setSelectedRooms((prev) => {
      const next = { ...prev };
      if (next[roomId]) next[roomId] = { ...next[roomId], guests };
      return next;
    });
  };

  const setRoomAddon = (roomId: string, addonId: string, qty: number) => {
    setSelectedRooms((prev) => {
      const next = { ...prev };
      const sel = next[roomId];
      if (!sel) return prev;
      const newAddons = { ...sel.addons };
      if (qty <= 0) delete newAddons[addonId];
      else newAddons[addonId] = qty;
      next[roomId] = { ...sel, addons: newAddons };
      return next;
    });
  };

  // ----- Step 4: submit -----
  const handleSubmit = async () => {
    setError(null);

    if (!guestName.trim() || !phone.trim() || !email.trim()) {
      setError("Please fill in name, phone, and email.");
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      setError("Phone must be exactly 10 digits.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (selectedRoomCount === 0) {
      setError("Please select at least one room.");
      return;
    }

    setSubmitting(true);
    const roomsPayload = Object.values(selectedRooms).map((sel) => ({
      room_id: sel.roomId,
      guests: sel.guests,
    }));
    const addonsPayload: Array<{
      room_id: string;
      addon_id: string;
      quantity: number;
    }> = [];
    for (const sel of Object.values(selectedRooms)) {
      for (const [addonId, qty] of Object.entries(sel.addons)) {
        if (qty > 0)
          addonsPayload.push({
            room_id: sel.roomId,
            addon_id: addonId,
            quantity: qty,
          });
      }
    }

    const { data, error: rpcError } = await supabase.rpc("create_booking", {
      p_guest_name: guestName.trim(),
      p_phone: phone.trim(),
      p_email: email.trim().toLowerCase(),
      p_check_in: checkIn,
      p_check_out: checkOut,
      p_special_requests: specialRequests.trim() || null,
      p_rooms: roomsPayload,
      p_addons: addonsPayload,
    });
    setSubmitting(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    // Handles both jsonb (new) and array (legacy) return shapes
    let code: string | null = null;
    if (data) {
      if (Array.isArray(data)) {
        code = (data[0] as { booking_code?: string } | undefined)?.booking_code ?? null;
      } else if (typeof data === "object") {
        code = (data as { booking_code?: string }).booking_code ?? null;
      }
    }
    setBookingCode(code);
    setStep(5);
  };

  // -------- RENDER --------
  return (
    <div className="space-y-5 sm:space-y-6 pb-24 sm:pb-0">
      {step < 5 && <StepIndicator step={step} />}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {step === 1 && (
        <Card>
          <CardContent className="space-y-5">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl tracking-tight">
                When are you visiting?
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5">
                Pick your dates to see what&apos;s available.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ci" className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  Check-in
                </Label>
                <Input
                  id="ci"
                  type="date"
                  min={todayIso()}
                  max={addDaysIso(todayIso(), MAX_DAYS_AHEAD)}
                  value={checkIn}
                  onChange={(e) => {
                    setCheckIn(e.target.value);
                    if (e.target.value && checkOut <= e.target.value) {
                      setCheckOut(addDaysIso(e.target.value, 1));
                    }
                  }}
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="co" className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  Check-out
                </Label>
                <Input
                  id="co"
                  type="date"
                  min={checkIn ? addDaysIso(checkIn, 1) : todayIso()}
                  max={addDaysIso(todayIso(), MAX_DAYS_AHEAD + 30)}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="h-12 text-base"
                />
              </div>
            </div>
            {nights > 0 && (
              <p className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-primary" />
                {nights} night{nights === 1 ? "" : "s"} ·{" "}
                {formatDate(checkIn)} → {formatDate(checkOut)}
              </p>
            )}
            <Button
              onClick={() => handleStep1Next()}
              disabled={loadingRooms}
              size="lg"
              className="w-full sm:w-auto sm:ml-auto sm:flex"
            >
              {loadingRooms ? <Loader2 className="animate-spin" /> : null}
              See available rooms
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <RoomSelectStep
          rooms={availableRooms}
          addons={availableAddons}
          selected={selectedRooms}
          toggleRoom={toggleRoom}
          setRoomGuests={setRoomGuests}
          setRoomAddon={setRoomAddon}
          nights={nights}
          totals={totals}
          checkIn={checkIn}
          checkOut={checkOut}
          onBack={() => setStep(1)}
          onNext={() => {
            if (selectedRoomCount === 0) {
              setError("Please select at least one room to continue.");
              return;
            }
            setError(null);
            setStep(3);
          }}
        />
      )}

      {step === 3 && (
        <Card>
          <CardContent className="space-y-5">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl tracking-tight">
                Your details
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5">
                We&apos;ll use this to confirm your booking.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="g_name">Full name</Label>
                <Input
                  id="g_name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="h-12 text-base"
                  autoComplete="name"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="g_phone">Phone (10 digits)</Label>
                  <Input
                    id="g_phone"
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder="9876543210"
                    maxLength={10}
                    pattern="\d{10}"
                    autoComplete="tel"
                    className="h-12 text-base"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="g_email">Email</Label>
                  <Input
                    id="g_email"
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="h-12 text-base"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="g_req">Special requests (optional)</Label>
                <Textarea
                  id="g_req"
                  rows={3}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Early check-in, dietary preferences, etc."
                  className="text-base"
                />
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setError(null);
                  setStep(2);
                }}
                size="lg"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                size="lg"
                onClick={() => {
                  if (!guestName.trim() || !phone.trim() || !email.trim()) {
                    setError("Please fill in name, phone, and email.");
                    return;
                  }
                  if (!/^\d{10}$/.test(phone)) {
                    setError("Phone must be exactly 10 digits.");
                    return;
                  }
                  setError(null);
                  setStep(4);
                }}
              >
                Review booking
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardContent className="space-y-5">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl tracking-tight">
                Review your booking
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5">
                Please verify everything before submitting.
              </p>
            </div>

            <div className="rounded-xl border divide-y">
              <div className="px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  Stay
                </p>
                <p className="mt-1 font-medium">
                  {formatDate(checkIn)} → {formatDate(checkOut)} · {nights} night
                  {nights === 1 ? "" : "s"}
                </p>
              </div>
              <div className="px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  Guest
                </p>
                <p className="mt-1 font-medium">{guestName}</p>
                <p className="text-xs text-muted-foreground">
                  {phone} · {email}
                </p>
              </div>
              <div className="px-4 py-3 space-y-2">
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  Rooms
                </p>
                {Object.values(selectedRooms).map((sel) => {
                  const room = availableRooms.find((r) => r.id === sel.roomId);
                  if (!room) return null;
                  return (
                    <div key={sel.roomId} className="text-sm">
                      <div className="flex justify-between">
                        <span>
                          #{room.room_number} · {room.name}
                          <span className="text-muted-foreground">
                            {" "}
                            · {sel.guests} guest{sel.guests === 1 ? "" : "s"}
                          </span>
                        </span>
                        <span className="tabular-nums">
                          {formatCurrency(Number(room.base_price) * nights)}
                        </span>
                      </div>
                      {Object.entries(sel.addons)
                        .filter(([, q]) => q > 0)
                        .map(([addonId, qty]) => {
                          const addon = availableAddons.find(
                            (a) => a.id === addonId
                          );
                          if (!addon) return null;
                          const charge =
                            Number(addon.price) *
                            qty *
                            (addon.is_per_night ? nights : 1);
                          return (
                            <div
                              key={addonId}
                              className="flex justify-between text-xs text-muted-foreground pl-3"
                            >
                              <span>
                                + {addon.name} × {qty}
                              </span>
                              <span className="tabular-nums">
                                {formatCurrency(charge)}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  );
                })}
              </div>
              {specialRequests && (
                <div className="px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Special requests
                  </p>
                  <p className="text-sm mt-1 whitespace-pre-wrap">
                    {specialRequests}
                  </p>
                </div>
              )}
              <div className="px-4 py-4 flex justify-between items-baseline bg-secondary/40">
                <span className="text-sm font-medium">Total</span>
                <span className="font-display text-3xl font-semibold tabular-nums">
                  {formatCurrency(totals.total)}
                </span>
              </div>
            </div>

            <div className="rounded-lg bg-accent/40 p-3 sm:p-4 text-sm">
              <p className="font-medium">No advance payment required</p>
              <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                Your booking will be marked &quot;Pending&quot; until our staff
                confirms it. We&apos;ll contact you on {phone || "your phone"}{" "}
                shortly. Payment can be made at the hotel by cash, UPI, or
                bank transfer.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep(3)}
                disabled={submitting}
                size="lg"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={submitting} size="lg">
                {submitting ? <Loader2 className="animate-spin" /> : null}
                Confirm booking
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 5 && bookingCode && (
        <Card>
          <CardContent className="space-y-5 text-center py-10 sm:py-14">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/15 mx-auto">
              <CheckCircle2 className="h-9 w-9 text-success" />
            </div>
            <div>
              <h2 className="font-display text-3xl sm:text-4xl tracking-tight">
                Booking received!
              </h2>
              <p className="text-muted-foreground mt-2 text-base">
                Thank you, {guestName}. We&apos;ll confirm shortly on {phone}.
              </p>
            </div>
            <BookingCodeBox code={bookingCode} />
            <div className="text-sm text-muted-foreground max-w-md mx-auto space-y-2 pt-2 leading-relaxed">
              <p>
                Save this booking code. You can use it to view your booking
                anytime.
              </p>
              <p>
                Status starts as <span className="font-medium">Pending</span>{" "}
                and will move to <span className="font-medium">Confirmed</span>{" "}
                once our staff verifies and contacts you.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <Button asChild variant="outline" size="lg">
                <Link href="/my-booking">View my booking</Link>
              </Button>
              <Button asChild size="lg">
                <Link href="/">Done</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Step indicator — compact dots on mobile, full labels on desktop
// -----------------------------------------------------------------------------

function StepIndicator({ step }: { step: Step }) {
  const steps = [
    { n: 1, label: "Dates" },
    { n: 2, label: "Rooms" },
    { n: 3, label: "Details" },
    { n: 4, label: "Review" },
  ];
  const current = steps.find((s) => s.n === step);

  return (
    <div>
      {/* Mobile: compact, just current step */}
      <div className="sm:hidden">
        <p className="text-xs text-muted-foreground mb-2">
          Step {step} of {steps.length}
        </p>
        <p className="font-display text-lg tracking-tight">
          {current?.label}
        </p>
        <div className="mt-2 flex gap-1.5">
          {steps.map((s) => (
            <div
              key={s.n}
              className={cn(
                "flex-1 h-1 rounded-full transition-colors",
                s.n <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Desktop: pill-based */}
      <ol className="hidden sm:flex items-center gap-2 text-xs">
        {steps.map((s, i) => {
          const active = s.n === step;
          const done = s.n < step;
          return (
            <li key={s.n} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors",
                  active && "bg-primary text-primary-foreground",
                  done && "bg-success/15 text-success",
                  !active && !done && "bg-muted text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-medium",
                    active && "bg-primary-foreground/20",
                    done && "bg-success/30",
                    !active && !done && "bg-muted-foreground/20"
                  )}
                >
                  {done ? "✓" : s.n}
                </span>
                <span className="font-medium">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <span className="h-px w-3 bg-border" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function BookingCodeBox({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {}
      }}
      className="group inline-flex items-center gap-3 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 px-6 py-4 mx-auto hover:bg-primary/10 transition-colors"
    >
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Your booking code
        </p>
        <p className="font-mono text-2xl font-semibold tracking-wider mt-1">
          {code}
        </p>
      </div>
      <Copy className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      <span className="sr-only">{copied ? "Copied!" : "Click to copy"}</span>
    </button>
  );
}

// -----------------------------------------------------------------------------
// Step 2 — room selection with sticky bottom action bar on mobile
// -----------------------------------------------------------------------------

function RoomSelectStep({
  rooms,
  addons,
  selected,
  toggleRoom,
  setRoomGuests,
  setRoomAddon,
  nights,
  totals,
  checkIn,
  checkOut,
  onBack,
  onNext,
}: {
  rooms: Room[];
  addons: Addon[];
  selected: Record<string, SelectedRoom>;
  toggleRoom: (room: Room) => void;
  setRoomGuests: (roomId: string, guests: number) => void;
  setRoomAddon: (roomId: string, addonId: string, qty: number) => void;
  nights: number;
  totals: { roomsSub: number; addonsSub: number; total: number };
  checkIn: string;
  checkOut: string;
  onBack: () => void;
  onNext: () => void;
}) {
  // Group rooms by type
  const grouped = useMemo(() => {
    const m = new Map<string, Room[]>();
    for (const r of rooms) {
      const arr = m.get(r.room_type) ?? [];
      arr.push(r);
      m.set(r.room_type, arr);
    }
    return m;
  }, [rooms]);
  const types = Array.from(grouped.keys());
  const selectedCount = Object.keys(selected).length;

  return (
    <>
      <Card>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl tracking-tight">
                Choose your rooms
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5">
                {formatDate(checkIn)} → {formatDate(checkOut)} · {nights} night
                {nights === 1 ? "" : "s"} ·{" "}
                <span className="text-foreground font-medium">
                  {rooms.length} available
                </span>
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ChevronLeft className="h-4 w-4" />
              Change dates
            </Button>
          </div>

          {rooms.length === 0 ? (
            <div className="rounded-xl border border-warning/40 bg-warning/5 py-10 px-4 text-center">
              <AlertCircle className="h-10 w-10 text-warning mx-auto mb-3" />
              <p className="font-medium">
                No rooms available for those dates.
              </p>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                We may have last-minute availability — please give us a call to
                check directly.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {types.map((type) => (
                <div key={type} className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-display text-xl tracking-tight">
                      {type}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {grouped.get(type)!.length} room
                      {grouped.get(type)!.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {grouped.get(type)!.map((room) => {
                      const sel = selected[room.id];
                      return (
                        <RoomCard
                          key={room.id}
                          room={room}
                          addons={addons}
                          selected={sel}
                          nights={nights}
                          onToggle={() => toggleRoom(room)}
                          onGuestsChange={(g) => setRoomGuests(room.id, g)}
                          onAddonChange={(addonId, qty) =>
                            setRoomAddon(room.id, addonId, qty)
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Desktop continue button (inline) */}
          {totals.total > 0 && (
            <div className="hidden sm:flex rounded-xl border bg-secondary/40 p-4 flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Estimated total
                </p>
                <p className="font-display text-3xl font-semibold tabular-nums mt-0.5">
                  {formatCurrency(totals.total)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedCount} room{selectedCount === 1 ? "" : "s"} ·{" "}
                  {nights} night{nights === 1 ? "" : "s"}
                  {totals.addonsSub > 0 &&
                    ` · ${formatCurrency(totals.addonsSub)} add-ons`}
                </p>
              </div>
              <Button onClick={onNext} size="lg">
                Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile sticky bottom bar */}
      {totals.total > 0 && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-20 bg-card/95 backdrop-blur border-t border-border px-4 py-3 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {selectedCount} room{selectedCount === 1 ? "" : "s"} ·{" "}
                {nights}N
              </p>
              <p className="font-display text-xl font-semibold tabular-nums leading-none mt-0.5">
                {formatCurrency(totals.total)}
              </p>
            </div>
            <Button onClick={onNext} size="lg">
              Continue
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

// -----------------------------------------------------------------------------
// Room card — vertical layout, photo on top, mobile-friendly
// -----------------------------------------------------------------------------

function RoomCard({
  room,
  addons,
  selected,
  nights,
  onToggle,
  onGuestsChange,
  onAddonChange,
}: {
  room: Room;
  addons: Addon[];
  selected: SelectedRoom | undefined;
  nights: number;
  onToggle: () => void;
  onGuestsChange: (g: number) => void;
  onAddonChange: (addonId: string, qty: number) => void;
}) {
  const photos = Array.isArray(room.photos) ? room.photos : [];
  const photoUrl = photos[0] ? storagePublicUrl(photos[0]) : null;
  const isSelected = !!selected;
  const [galleryOpen, setGalleryOpen] = useState(false);

  return (
    <div
      className={cn(
        "rounded-xl border bg-card overflow-hidden transition-all",
        isSelected
          ? "border-primary ring-2 ring-primary/20 shadow-sm"
          : "border-border hover:border-primary/40"
      )}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Photo — click to open the gallery when photos exist */}
        <div
          className={cn(
            "relative sm:w-48 h-40 sm:h-auto bg-gradient-to-br from-primary/10 to-accent/30 shrink-0 flex items-center justify-center overflow-hidden",
            photoUrl && "cursor-pointer group/photo"
          )}
          onClick={photoUrl ? () => setGalleryOpen(true) : undefined}
          role={photoUrl ? "button" : undefined}
          tabIndex={photoUrl ? 0 : undefined}
          onKeyDown={
            photoUrl
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setGalleryOpen(true);
                  }
                }
              : undefined
          }
          aria-label={photoUrl ? `View ${room.name} photos` : undefined}
        >
          {photoUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                alt={room.name}
                className="w-full h-full object-cover transition-transform group-hover/photo:scale-105"
              />
              {photos.length > 1 && (
                <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/55 backdrop-blur text-white text-[10px] font-medium px-2 py-1">
                  <Images className="h-3 w-3" />
                  {photos.length}
                </span>
              )}
            </>
          ) : (
            <BedDouble className="h-12 w-12 text-primary/30" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <p className="font-display text-lg tracking-tight leading-tight">
                {room.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Room #{room.room_number} · {room.room_type}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-display text-xl font-semibold tabular-nums">
                {formatCurrency(Number(room.base_price))}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                per night
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mb-3">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              Sleeps {room.max_occupancy}
            </span>
          </div>

          {room.description && (
            <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
              {room.description}
            </p>
          )}

          <div className="mt-auto">
            <Button
              type="button"
              variant={isSelected ? "secondary" : "default"}
              size="sm"
              onClick={onToggle}
              className="w-full sm:w-auto"
            >
              {isSelected ? "Remove from booking" : "Select this room"}
            </Button>
          </div>
        </div>
      </div>

      {isSelected && selected && (
        <div className="border-t border-border bg-muted/30 px-4 sm:px-5 py-4 space-y-4">
          {/* Guests stepper */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label className="text-sm">Guests</Label>
              <p className="text-[11px] text-muted-foreground">
                Max {room.max_occupancy}
              </p>
            </div>
            <Stepper
              value={selected.guests}
              min={1}
              max={room.max_occupancy}
              onChange={onGuestsChange}
            />
          </div>

          {/* Add-ons */}
          {addons.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Add-ons (optional)
              </p>
              <div className="space-y-2">
                {addons.map((a) => {
                  const qty = selected.addons[a.id] ?? 0;
                  return (
                    <div
                      key={a.id}
                      className="flex items-center justify-between gap-3 rounded-lg bg-card border border-border px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight">
                          {a.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatCurrency(a.price)}
                          {a.is_per_night ? " /night" : ""}
                        </p>
                      </div>
                      <Stepper
                        value={qty}
                        min={0}
                        max={a.max_per_room}
                        onChange={(v) => onAddonChange(a.id, v)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {nights > 0 && (
            <p className="text-xs text-muted-foreground tabular-nums pt-1 border-t border-border">
              Room subtotal:{" "}
              <span className="font-medium">
                {formatCurrency(Number(room.base_price) * nights)}
              </span>{" "}
              ({nights} night{nights === 1 ? "" : "s"})
            </p>
          )}
        </div>
      )}

      <Lightbox
        photos={photos}
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        title={`${room.name} · Room #${room.room_number}`}
      />
    </div>
  );
}

function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-lg border border-input bg-background">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="h-10 w-10 inline-flex items-center justify-center hover:bg-muted transition-colors rounded-l-lg disabled:opacity-30"
        aria-label="Decrease"
        disabled={value <= min}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-10 text-center text-sm font-medium tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="h-10 w-10 inline-flex items-center justify-center hover:bg-muted transition-colors rounded-r-lg disabled:opacity-30"
        aria-label="Increase"
        disabled={value >= max}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
