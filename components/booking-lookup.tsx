"use client";

import { useState } from "react";
import {
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  Users,
  Phone as PhoneIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, Card, CardContent } from "@/components/ui/primitives";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { BookingLookupResult } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending confirmation",
  confirmed: "Confirmed",
  checked_in: "Checked in",
  checked_out: "Checked out",
  cancelled: "Cancelled",
  no_show: "No-show",
  expired: "Expired",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/15 text-warning-foreground border-warning/30",
  confirmed: "bg-primary/15 text-primary border-primary/30",
  checked_in: "bg-success/15 text-success border-success/30",
  checked_out: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
  no_show: "bg-destructive/10 text-destructive border-destructive/30",
  expired: "bg-muted text-muted-foreground border-border",
};

export function BookingLookup() {
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BookingLookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotFound(false);
    setResult(null);

    if (!code.trim() || !phone.trim()) {
      setError("Please enter both your booking code and phone number.");
      return;
    }

    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc(
      "get_booking_by_code",
      {
        p_booking_code: code.trim().toUpperCase(),
        p_phone: phone.trim(),
      }
    );
    setLoading(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    if (!data) {
      setNotFound(true);
      return;
    }
    setResult(data as BookingLookupResult);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="bl_code">Booking code</Label>
                <Input
                  id="bl_code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="RAB-XXXXXX"
                  className="font-mono uppercase tracking-wider"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bl_phone">Phone (10 digits)</Label>
                <Input
                  id="bl_phone"
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
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" disabled={loading} size="lg" className="w-full">
              {loading ? <Loader2 className="animate-spin" /> : <Search />}
              Look up booking
            </Button>
          </form>
        </CardContent>
      </Card>

      {notFound && (
        <Card>
          <CardContent className="py-10 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-medium">No booking found</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              We couldn&apos;t find a booking matching that code and phone number.
              Double-check both — the code is case-insensitive (we&apos;ll
              uppercase it for you).
            </p>
          </CardContent>
        </Card>
      )}

      {result && <BookingResult booking={result} />}
    </div>
  );
}

function BookingResult({ booking }: { booking: BookingLookupResult }) {
  const statusColor =
    STATUS_COLORS[booking.status] ?? STATUS_COLORS.checked_out;
  const statusLabel = STATUS_LABELS[booking.status] ?? booking.status;

  return (
    <Card>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Booking
            </p>
            <p className="font-mono text-lg font-semibold tracking-wider mt-0.5">
              {booking.booking_code}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {booking.guest_name}
            </p>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
              statusColor
            )}
          >
            <CheckCircle2 className="h-3 w-3" />
            {statusLabel}
          </span>
        </div>

        <div className="rounded-md border divide-y">
          <div className="px-4 py-3 flex items-start gap-3">
            <CalendarDays className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Stay
              </p>
              <p className="text-sm font-medium mt-0.5">
                {formatDate(booking.check_in)} → {formatDate(booking.check_out)}
              </p>
              <p className="text-xs text-muted-foreground">
                {booking.nights} night{booking.nights === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="px-4 py-3 flex items-start gap-3">
            <Users className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Rooms
              </p>
              <ul className="text-sm mt-1 space-y-1">
                {booking.rooms.map((r, i) => (
                  <li key={i} className="flex justify-between">
                    <span>
                      #{r.room_number} · {r.name}
                      <span className="text-muted-foreground">
                        {" "}
                        · {r.guests} guest{r.guests === 1 ? "" : "s"}
                      </span>
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatCurrency(Number(r.rate_per_night))} /night
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {booking.special_requests && (
            <div className="px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Special requests
              </p>
              <p className="text-sm mt-1 whitespace-pre-wrap">
                {booking.special_requests}
              </p>
            </div>
          )}

          <div className="px-4 py-3 grid grid-cols-3 gap-3 bg-secondary/30">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Total
              </p>
              <p className="text-base font-semibold tabular-nums mt-0.5">
                {formatCurrency(Number(booking.total_amount))}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Paid
              </p>
              <p className="text-base font-semibold tabular-nums mt-0.5">
                {formatCurrency(Number(booking.paid_amount))}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Balance
              </p>
              <p
                className={cn(
                  "text-base font-semibold tabular-nums mt-0.5",
                  Number(booking.balance) > 0
                    ? "text-destructive"
                    : "text-success"
                )}
              >
                {formatCurrency(Number(booking.balance))}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-md bg-accent/40 p-3 text-sm flex items-start gap-2">
          <PhoneIcon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-muted-foreground">
            Need to make changes? Call us or send a WhatsApp message — we&apos;ll
            help you sort it out.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
