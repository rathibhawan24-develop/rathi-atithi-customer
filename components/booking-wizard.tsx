"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, Textarea, Card, CardContent } from "@/components/ui/primitives";
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
  addons: Record<string, number>; // addonId -> quantity
};

const MAX_DAYS_AHEAD = 180;

export function BookingWizard() {
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [checkIn, setCheckIn] = useState(todayIso());
  const [checkOut, setCheckOut] = useState(addDaysIso(todayIso(), 1));

  // Step 2 data
  // Holds ALL active rooms with an `isAvailable` flag. Booked rooms still show
  // in the list (marked "Already booked") so guests aren't confused about
  // missing rooms. They're sorted to the bottom of each type group.
  const [allRooms, setAllRooms] = useState<Array<Room & { isAvailable: boolean }>>(
    []
  );
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
      const room = allRooms.find((r) => r.id === sel.roomId);
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
  }, [selectedRooms, allRooms, availableAddons, nights]);

  const selectedRoomCount = Object.keys(selectedRooms).length;

  // ----- Step 1: validate dates and fetch availability -----
  const handleStep1Next = async () => {
    setError(null);
    if (!checkIn || !checkOut) {
      setError("Please pick check-in and check-out dates.");
      return;
    }
    if (nights < 1) {
      setError("Check-out must be after check-in.");
      return;
    }
    if (checkIn < todayIso()) {
      setError("Check-in date cannot be in the past.");
      return;
    }
    if (checkIn > addDaysIso(todayIso(), MAX_DAYS_AHEAD)) {
      setError(`Bookings can only be made up to ${MAX_DAYS_AHEAD} days ahead.`);
      return;
    }

    setLoadingRooms(true);
    // Fetch all active rooms AND the available subset in parallel. We need both
    // so we can show booked rooms in the list (with an "Already booked" badge)
    // instead of hiding them entirely.
    const [allRoomsRes, availableRes, addonsRes] = await Promise.all([
      supabase
        .from("rooms")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true }),
      supabase.rpc("get_available_rooms", {
        p_check_in: checkIn,
        p_check_out: checkOut,
      }),
      supabase
        .from("addons")
        .select("*")
        .eq("is_active", true)
        .order("display_order"),
    ]);
    setLoadingRooms(false);

    if (allRoomsRes.error) {
      setError(allRoomsRes.error.message);
      return;
    }
    if (availableRes.error) {
      setError(availableRes.error.message);
      return;
    }
    const availableIds = new Set(
      ((availableRes.data ?? []) as Room[]).map((r) => r.id)
    );
    const merged = ((allRoomsRes.data ?? []) as Room[]).map((r) => ({
      ...r,
      isAvailable: availableIds.has(r.id),
    }));
    setAllRooms(merged);
    setAvailableAddons((addonsRes.data ?? []) as Addon[]);
    setSelectedRooms({});
    setStep(2);
  };

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
    // The RPC returns either a jsonb object { booking_code, booking_id }
    // (current) or an array of rows with booking_code (legacy TABLE return).
    // Handle both shapes defensively.
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
    <div className="space-y-6">
      {step < 5 && <StepIndicator step={step} />}

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {step === 1 && (
        <Card>
          <CardContent className="space-y-5">
            <div>
              <h2 className="font-display text-2xl">Pick your dates</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Bookings can be made up to {MAX_DAYS_AHEAD} days in advance.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ci">Check-in</Label>
                <Input
                  id="ci"
                  type="date"
                  min={todayIso()}
                  max={addDaysIso(todayIso(), MAX_DAYS_AHEAD)}
                  value={checkIn}
                  onChange={(e) => {
                    setCheckIn(e.target.value);
                    // Auto-advance checkout if it's now invalid
                    if (e.target.value && checkOut <= e.target.value) {
                      setCheckOut(addDaysIso(e.target.value, 1));
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="co">Check-out</Label>
                <Input
                  id="co"
                  type="date"
                  min={checkIn ? addDaysIso(checkIn, 1) : todayIso()}
                  max={addDaysIso(todayIso(), MAX_DAYS_AHEAD + 30)}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>
            </div>
            {nights > 0 && (
              <p className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                {nights} night{nights === 1 ? "" : "s"} ·{" "}
                {formatDate(checkIn)} → {formatDate(checkOut)}
              </p>
            )}
            <div className="flex justify-end">
              <Button
                onClick={handleStep1Next}
                disabled={loadingRooms}
                size="lg"
              >
                {loadingRooms ? <Loader2 className="animate-spin" /> : null}
                See available rooms
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <RoomSelectStep
          rooms={allRooms}
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
              <h2 className="font-display text-2xl">Your details</h2>
              <p className="text-sm text-muted-foreground mt-1">
                We&apos;ll use this to confirm your booking.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="g_name">Full name</Label>
                <Input
                  id="g_name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
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
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="g_email">Email</Label>
                  <Input
                    id="g_email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="g_req">Special requests (optional)</Label>
                <Textarea
                  id="g_req"
                  rows={3}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Early check-in, dietary preferences, etc."
                />
              </div>
            </div>
            <div className="flex flex-wrap justify-between gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setError(null);
                  setStep(2);
                }}
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
              <h2 className="font-display text-2xl">Review your booking</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Please verify everything before submitting.
              </p>
            </div>

            <div className="rounded-md border divide-y">
              <div className="px-4 py-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Stay
                </p>
                <p className="mt-1 font-medium">
                  {formatDate(checkIn)} → {formatDate(checkOut)} · {nights} night
                  {nights === 1 ? "" : "s"}
                </p>
              </div>
              <div className="px-4 py-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Guest
                </p>
                <p className="mt-1 font-medium">{guestName}</p>
                <p className="text-xs text-muted-foreground">
                  {phone} · {email}
                </p>
              </div>
              <div className="px-4 py-3 space-y-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Rooms
                </p>
                {Object.values(selectedRooms).map((sel) => {
                  const room = allRooms.find((r) => r.id === sel.roomId);
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
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Special requests
                  </p>
                  <p className="text-sm mt-1 whitespace-pre-wrap">
                    {specialRequests}
                  </p>
                </div>
              )}
              <div className="px-4 py-3 flex justify-between items-baseline bg-secondary/30">
                <span className="text-sm font-medium">Total</span>
                <span className="text-2xl font-semibold tabular-nums">
                  {formatCurrency(totals.total)}
                </span>
              </div>
            </div>

            <div className="rounded-md bg-accent/40 p-3 text-sm">
              <p className="font-medium">No advance payment required</p>
              <p className="text-muted-foreground text-xs mt-1">
                This booking will be marked &quot;Pending&quot; until our staff
                confirms it. We&apos;ll contact you on {phone || "your phone"}{" "}
                to confirm. Payment can be made at the hotel by cash, UPI, or
                bank transfer.
              </p>
            </div>

            <div className="flex flex-wrap justify-between gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep(3)}
                disabled={submitting}
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
          <CardContent className="space-y-5 text-center py-10">
            <CheckCircle2 className="h-14 w-14 text-success mx-auto" />
            <div>
              <h2 className="font-display text-3xl">Booking received!</h2>
              <p className="text-muted-foreground mt-2">
                Thank you, {guestName}. We&apos;ll confirm shortly on {phone}.
              </p>
            </div>
            <BookingCodeBox code={bookingCode} />
            <div className="text-sm text-muted-foreground max-w-md mx-auto space-y-2 pt-2">
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
              <Button asChild variant="outline">
                <Link href="/my-booking">View my booking</Link>
              </Button>
              <Button asChild>
                <Link href="/">Done</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps = [
    { n: 1, label: "Dates" },
    { n: 2, label: "Rooms" },
    { n: 3, label: "Details" },
    { n: 4, label: "Review" },
  ];
  return (
    <ol className="flex items-center gap-2 text-xs">
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
      className="group inline-flex items-center gap-3 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 px-6 py-4 mx-auto"
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
// Step 2 sub-component (room selection)
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
  rooms: Array<Room & { isAvailable: boolean }>;
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
  // Group rooms by type. Within each group, sort available first, booked last.
  const grouped = useMemo(() => {
    const m = new Map<string, Array<Room & { isAvailable: boolean }>>();
    for (const r of rooms) {
      const arr = m.get(r.room_type) ?? [];
      arr.push(r);
      m.set(r.room_type, arr);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => {
        if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
        return a.display_order - b.display_order;
      });
    }
    return m;
  }, [rooms]);
  const types = Array.from(grouped.keys());

  const availableCount = rooms.filter((r) => r.isAvailable).length;
  const bookedCount = rooms.length - availableCount;

  return (
    <Card>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="font-display text-2xl">Choose your rooms</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDate(checkIn)} → {formatDate(checkOut)} · {nights} night
              {nights === 1 ? "" : "s"} · {availableCount} available
              {bookedCount > 0 && `, ${bookedCount} already booked`}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
            Change dates
          </Button>
        </div>

        {rooms.length === 0 ? (
          <div className="rounded-md border border-dashed py-8 text-center">
            <p className="font-medium">No rooms in the system.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Please contact us directly.
            </p>
          </div>
        ) : availableCount === 0 ? (
          <div className="rounded-md border border-warning/40 bg-warning/5 py-8 px-4 text-center">
            <p className="font-medium">All rooms are booked for those dates.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Please try different dates or contact us — we may have last-minute
              availability.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {types.map((type) => (
              <div key={type} className="space-y-2">
                <h3 className="font-display text-lg">{type}</h3>
                <div className="space-y-2">
                  {grouped.get(type)!.map((room) => {
                    const sel = selected[room.id];
                    return (
                      <RoomRow
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

        {totals.total > 0 && (
          <div className="rounded-md border bg-secondary/40 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Estimated total
              </p>
              <p className="text-2xl font-semibold tabular-nums mt-1">
                {formatCurrency(totals.total)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {Object.keys(selected).length} room
                {Object.keys(selected).length === 1 ? "" : "s"} · {nights} night
                {nights === 1 ? "" : "s"}
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
  );
}

function RoomRow({
  room,
  addons,
  selected,
  nights,
  onToggle,
  onGuestsChange,
  onAddonChange,
}: {
  room: Room & { isAvailable: boolean };
  addons: Addon[];
  selected: SelectedRoom | undefined;
  nights: number;
  onToggle: () => void;
  onGuestsChange: (g: number) => void;
  onAddonChange: (addonId: string, qty: number) => void;
}) {
  const photoUrl =
    room.photos && room.photos[0] ? storagePublicUrl(room.photos[0]) : null;
  const isSelected = !!selected;
  const isBooked = !room.isAvailable;

  return (
    <div
      className={cn(
        "rounded-lg border transition-colors",
        isBooked
          ? "border-border bg-muted/30 opacity-70"
          : isSelected
          ? "border-primary bg-primary/5"
          : "border-border bg-card"
      )}
    >
      <div className="flex flex-wrap sm:flex-nowrap gap-3 p-3">
        <div className="w-full sm:w-32 h-24 sm:h-20 rounded-md overflow-hidden bg-muted shrink-0 flex items-center justify-center">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={room.name}
              className={cn(
                "w-full h-full object-cover",
                isBooked && "grayscale"
              )}
            />
          ) : (
            <BedDouble className="h-8 w-8 text-muted-foreground/40" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium">
                  #{room.room_number} · {room.name}
                </p>
                {isBooked && (
                  <span className="inline-flex items-center rounded-full border border-muted-foreground/30 bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    Already booked
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                <Users className="h-3 w-3" />
                Sleeps {room.max_occupancy}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold tabular-nums">
                {formatCurrency(Number(room.base_price))}
              </p>
              <p className="text-[10px] text-muted-foreground">per night</p>
            </div>
          </div>
          {room.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {room.description}
            </p>
          )}
          {!isBooked && (
            <div className="mt-2">
              <Button
                type="button"
                variant={isSelected ? "secondary" : "default"}
                size="sm"
                onClick={onToggle}
              >
                {isSelected ? "Remove" : "Select"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {isSelected && selected && (
        <div className="border-t border-border px-3 py-3 space-y-3 bg-card">
          <div className="flex items-center gap-3 flex-wrap">
            <Label htmlFor={`guests-${room.id}`} className="text-xs">
              Guests
            </Label>
            <div className="inline-flex items-center rounded-md border border-input">
              <button
                type="button"
                onClick={() =>
                  onGuestsChange(Math.max(1, selected.guests - 1))
                }
                className="px-2.5 py-1 hover:bg-muted transition-colors"
                aria-label="Decrease"
              >
                −
              </button>
              <span className="px-3 text-sm tabular-nums">
                {selected.guests}
              </span>
              <button
                type="button"
                onClick={() =>
                  onGuestsChange(
                    Math.min(room.max_occupancy, selected.guests + 1)
                  )
                }
                className="px-2.5 py-1 hover:bg-muted transition-colors"
                aria-label="Increase"
              >
                +
              </button>
            </div>
            <span className="text-xs text-muted-foreground">
              Max {room.max_occupancy}
            </span>
          </div>

          {addons.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Add-ons (optional)
              </p>
              <div className="flex flex-wrap gap-2">
                {addons.map((a) => {
                  const qty = selected.addons[a.id] ?? 0;
                  return (
                    <div
                      key={a.id}
                      className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-xs"
                    >
                      <span>
                        {a.name} ·{" "}
                        <span className="text-muted-foreground">
                          {formatCurrency(a.price)}
                          {a.is_per_night ? " /night" : ""}
                        </span>
                      </span>
                      <div className="inline-flex items-center rounded border border-input">
                        <button
                          type="button"
                          onClick={() => onAddonChange(a.id, Math.max(0, qty - 1))}
                          className="px-1.5 hover:bg-muted"
                          aria-label="Decrease"
                        >
                          −
                        </button>
                        <span className="px-2 tabular-nums">{qty}</span>
                        <button
                          type="button"
                          onClick={() =>
                            onAddonChange(
                              a.id,
                              Math.min(a.max_per_room, qty + 1)
                            )
                          }
                          className="px-1.5 hover:bg-muted"
                          aria-label="Increase"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {nights > 0 && (
            <p className="text-xs text-muted-foreground tabular-nums">
              Room subtotal:{" "}
              {formatCurrency(Number(room.base_price) * nights)} ({nights}{" "}
              night{nights === 1 ? "" : "s"})
            </p>
          )}
        </div>
      )}
    </div>
  );
}
