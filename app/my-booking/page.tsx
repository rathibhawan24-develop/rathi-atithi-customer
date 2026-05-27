import { BookingLookup } from "@/components/booking-lookup";

export const dynamic = "force-static";

export const metadata = {
  title: "View my booking · Rathi Atithi Bhawan",
};

export default function MyBookingPage() {
  return (
    <div className="container py-10 md:py-14 max-w-2xl">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-2">
          Guest portal
        </p>
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">
          Check your booking.
        </h1>
        <p className="text-muted-foreground mt-2">
          Enter the booking code we gave you, along with the phone number on
          your booking. Both must match.
        </p>
      </header>

      <BookingLookup />
    </div>
  );
}
