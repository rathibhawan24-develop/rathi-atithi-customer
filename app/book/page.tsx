import { BookingWizard } from "@/components/booking-wizard";

export const dynamic = "force-static";

export const metadata = {
  title: "Book your stay · Rathi Atithi Bhawan",
};

export default function BookPage() {
  return (
    <div className="container py-10 md:py-14 max-w-3xl">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-2">
          Direct booking
        </p>
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">
          Reserve your stay.
        </h1>
        <p className="text-muted-foreground mt-2">
          Four simple steps. No advance payment, no booking fees.
        </p>
      </header>

      <BookingWizard />
    </div>
  );
}
