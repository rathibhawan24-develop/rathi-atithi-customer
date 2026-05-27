import Link from "next/link";
import Image from "next/image";
import {
  Bed,
  Users,
  Wifi,
  Coffee,
  Wind,
  ShowerHead,
  MapPin,
  Sparkles,
  Heart,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/primitives";
import { ContactForm } from "@/components/contact-form";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-static";

type RoomTypeSummary = {
  type: string;
  count: number;
  startingPrice: number;
  capacity: number;
  description: string;
};

const TYPE_DESCRIPTIONS: Record<string, string> = {
  Supreme:
    "Comfortable rooms for couples and solo pilgrims, with all essentials for a restful stay.",
  "4 Bed":
    "Spacious rooms ideal for small families, accommodating up to 4 guests in comfort.",
  Deluxe:
    "Premium rooms with extra space, perfect for couples seeking a touch more comfort.",
  "Sudama 6 Bed":
    "Our largest room — designed for groups and joint families, sleeps up to 6 guests.",
};

const TYPE_ORDER = ["Supreme", "4 Bed", "Deluxe", "Sudama 6 Bed"];

async function getRoomTypeSummaries(): Promise<RoomTypeSummary[]> {
  const { data } = await supabase
    .from("rooms")
    .select("room_type, base_price, max_occupancy")
    .eq("is_active", true);

  if (!data) return [];

  const map = new Map<
    string,
    { count: number; minPrice: number; capacity: number }
  >();

  for (const r of data) {
    const existing = map.get(r.room_type);
    if (existing) {
      existing.count += 1;
      existing.minPrice = Math.min(existing.minPrice, Number(r.base_price));
      existing.capacity = Math.max(existing.capacity, r.max_occupancy);
    } else {
      map.set(r.room_type, {
        count: 1,
        minPrice: Number(r.base_price),
        capacity: r.max_occupancy,
      });
    }
  }

  const summaries: RoomTypeSummary[] = [];
  for (const t of TYPE_ORDER) {
    const v = map.get(t);
    if (v) {
      summaries.push({
        type: t,
        count: v.count,
        startingPrice: v.minPrice,
        capacity: v.capacity,
        description: TYPE_DESCRIPTIONS[t] ?? "",
      });
    }
  }
  return summaries;
}

const AMENITIES = [
  { icon: Wifi, label: "Free Wi-Fi" },
  { icon: Coffee, label: "Tea & coffee" },
  { icon: Wind, label: "Air conditioning" },
  { icon: ShowerHead, label: "Hot water" },
  { icon: Bed, label: "Clean linen" },
  { icon: Sparkles, label: "Daily housekeeping" },
];

export default async function LandingPage() {
  const roomTypes = await getRoomTypeSummaries();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/15 via-accent/40 to-background" />
        <div className="container py-20 md:py-28 lg:py-32">
          <div className="max-w-3xl">
            <div className="mb-8 inline-block rounded-2xl bg-black p-3 shadow-xl">
              <Image
                src="/logo.png"
                alt="Rathi Atithi Bhawan logo"
                width={144}
                height={144}
                className="w-32 h-32 md:w-36 md:h-36 object-contain"
                priority
              />
            </div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-4">
              Vrindavan · Mathura · Uttar Pradesh
            </p>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight">
              A peaceful stay near the holy land.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl">
              Comfortable, family-friendly rooms in the heart of Vrindavan. Book
              directly with the hotel — no commission, no hidden fees.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="text-base">
                <Link href="/book">
                  Check availability
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base">
                <Link href="#rooms">View rooms</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-16 md:py-24">
        <div className="container grid md:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-3">
              About us
            </p>
            <h2 className="font-display text-3xl md:text-4xl tracking-tight">
              Built for pilgrims, families, and quiet travellers.
            </h2>
          </div>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Rathi Atithi Bhawan is a 20-room guest house in Vrindavan,
              welcoming visitors who come to walk the holy lanes, attend aarti,
              and find a moment of peace. Our rooms are clean, our staff are
              warm, and our prices are honest.
            </p>
            <p>
              Whether you&apos;re here for a single night or a longer pilgrimage,
              we&apos;ll help you settle in.
            </p>
            <ul className="grid grid-cols-2 gap-3 pt-2">
              <li className="flex items-center gap-2 text-sm text-foreground">
                <Heart className="h-4 w-4 text-primary" />
                Family-run
              </li>
              <li className="flex items-center gap-2 text-sm text-foreground">
                <Heart className="h-4 w-4 text-primary" />
                Walking distance to temples
              </li>
              <li className="flex items-center gap-2 text-sm text-foreground">
                <Heart className="h-4 w-4 text-primary" />
                No booking fees
              </li>
              <li className="flex items-center gap-2 text-sm text-foreground">
                <Heart className="h-4 w-4 text-primary" />
                Trusted by repeat guests
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Room types */}
      <section id="rooms" className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="max-w-2xl mb-10">
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-3">
              Our rooms
            </p>
            <h2 className="font-display text-3xl md:text-4xl tracking-tight">
              Four room types. Twenty rooms. One simple promise — a comfortable
              stay.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {roomTypes.map((t) => (
              <Card
                key={t.type}
                className="group hover:border-primary/50 transition-colors"
              >
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Bed className="h-8 w-8 text-primary" />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-accent/40 px-2 py-0.5 rounded">
                      {t.count} {t.count === 1 ? "room" : "rooms"}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-xl">{t.type}</h3>
                    <p className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-1">
                      <Users className="h-3 w-3" />
                      Sleeps up to {t.capacity}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {t.description}
                  </p>
                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      From
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(t.startingPrice)}
                      <span className="text-xs text-muted-foreground font-normal">
                        {" "}
                        /night
                      </span>
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Button asChild size="lg" variant="outline">
              <Link href="/book">
                Check availability & book
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-2xl mb-10">
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-3">
              Every room includes
            </p>
            <h2 className="font-display text-3xl md:text-4xl tracking-tight">
              The essentials, done right.
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {AMENITIES.map((a) => {
              const Icon = a.icon;
              return (
                <div
                  key={a.label}
                  className="rounded-lg border border-border bg-card px-4 py-5 flex flex-col items-center text-center gap-2"
                >
                  <Icon className="h-6 w-6 text-primary" />
                  <span className="text-xs font-medium">{a.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container max-w-3xl text-center">
          <MapPin className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="font-display text-3xl md:text-4xl tracking-tight">
            Right where you want to be.
          </h2>
          <p className="text-muted-foreground mt-4">
            Located in Vrindavan, walking distance to major temples and ghats.
            Easy access from Mathura station and Delhi by road.
          </p>
        </div>
      </section>

      {/* Contact form */}
      <section className="py-16 md:py-24">
        <div className="container max-w-2xl">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-3">
              Have a question?
            </p>
            <h2 className="font-display text-3xl md:text-4xl tracking-tight">
              Send us a message.
            </h2>
            <p className="text-muted-foreground mt-3">
              Group bookings, special requests, or anything else — we&apos;ll get
              back to you.
            </p>
          </div>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
