import Link from "next/link";
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
  Phone,
  MessageCircle,
  ShieldCheck,
  IndianRupee,
  Clock,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/primitives";
import { ContactForm } from "@/components/contact-form";
import { HeroSearch } from "@/components/hero-search";
import { RoomCarousel, type CarouselSlide } from "@/components/room-carousel";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-static";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// TODO: replace with real numbers from admin /settings once filled in
const PHONE_DISPLAY = "+91 90000 00000";
const PHONE_TEL = "+919000000000";
const WHATSAPP = "919000000000";

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
    "Spacious rooms ideal for small families, accommodating up to 4 guests.",
  Deluxe:
    "Premium rooms with extra space, perfect for couples seeking added comfort.",
  "Sudama 6 Bed":
    "Our largest room — designed for groups and joint families, sleeps up to 6.",
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
    if (v)
      summaries.push({
        type: t,
        count: v.count,
        startingPrice: v.minPrice,
        capacity: v.capacity,
        description: TYPE_DESCRIPTIONS[t] ?? "",
      });
  }
  return summaries;
}

// One slide per room type for the auto-rotating carousel. Uses the first
// available photo from any room of that type, falling back to a placeholder
// gradient when no photos have been uploaded yet. Photos will start appearing
// automatically on the next deploy after the client uploads via admin /rooms.
async function getCarouselSlides(): Promise<CarouselSlide[]> {
  const { data } = await supabase
    .from("rooms")
    .select(
      "id, room_type, name, base_price, max_occupancy, photos, display_order"
    )
    .eq("is_active", true)
    .order("display_order");
  if (!data || data.length === 0) return [];

  const slides: CarouselSlide[] = [];
  for (const type of TYPE_ORDER) {
    const typeRooms = data.filter((r) => r.room_type === type);
    if (typeRooms.length === 0) continue;
    // Gather every photo across all rooms of this type (de-duplicated).
    const photos: string[] = [];
    for (const r of typeRooms) {
      if (Array.isArray(r.photos)) {
        for (const p of r.photos as string[]) {
          if (p && !photos.includes(p)) photos.push(p);
        }
      }
    }
    const minPrice = Math.min(...typeRooms.map((r) => Number(r.base_price)));
    const maxCapacity = Math.max(...typeRooms.map((r) => r.max_occupancy));
    slides.push({
      id: type,
      photos,
      title: type,
      subtitle: `${typeRooms.length} room${
        typeRooms.length === 1 ? "" : "s"
      } available`,
      price: minPrice,
      capacity: maxCapacity,
    });
  }
  return slides;
}

const AMENITIES = [
  { icon: Wifi, label: "Free Wi-Fi" },
  { icon: Coffee, label: "Tea & coffee" },
  { icon: Wind, label: "Air conditioning" },
  { icon: ShowerHead, label: "Hot water" },
  { icon: Bed, label: "Clean linen" },
  { icon: Sparkles, label: "Daily housekeeping" },
];

const TRUST_SIGNALS = [
  { icon: ShieldCheck, label: "Family-run guesthouse" },
  { icon: IndianRupee, label: "No booking fees" },
  { icon: MapPin, label: "Walking distance to temples" },
  { icon: Clock, label: "24/7 staff support" },
];

export default async function LandingPage() {
  const [roomTypes, carouselSlides] = await Promise.all([
    getRoomTypeSummaries(),
    getCarouselSlides(),
  ]);

  return (
    <>
      {/* =============================== HERO =============================== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/20 via-accent/40 to-background" />
        <div
          className="absolute inset-0 -z-10 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="container pt-8 pb-12 sm:py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            {/* Logo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${BASE_PATH}/logo.png`}
              alt="Rathi Atithi Bhawan logo"
              className="mx-auto mb-5 sm:mb-8 w-28 h-28 sm:w-40 sm:h-40 md:w-48 md:h-48 object-contain drop-shadow-md"
            />

            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary font-medium">
              Vrindavan · Mathura · Uttar Pradesh
            </p>
            <h1 className="font-display text-[2rem] leading-[1.1] sm:text-5xl md:text-6xl sm:leading-[1.05] tracking-tight mt-3 sm:mt-4">
              A peaceful stay near the holy land.
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-3 sm:mt-4 max-w-xl mx-auto">
              Comfortable, family-friendly rooms in the heart of Vrindavan.
              Book directly — no commission, no hidden fees.
            </p>
            <p className="font-display italic text-primary/80 text-base sm:text-lg mt-4">
              राधे राधे
            </p>
          </div>

          {/* Inline date search */}
          <div className="max-w-3xl mx-auto mt-8 sm:mt-10">
            <HeroSearch />
          </div>

          {/* Trust signals */}
          <div className="max-w-3xl mx-auto mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {TRUST_SIGNALS.map((t) => {
              const Icon = t.icon;
              return (
                <div
                  key={t.label}
                  className="flex items-center gap-2 rounded-lg bg-card/60 backdrop-blur-sm border border-border/60 px-3 py-2"
                >
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-[11px] sm:text-xs font-medium leading-tight">
                    {t.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================= ROOMS GRID ============================ */}
      <section id="rooms" className="py-14 sm:py-20 md:py-24">
        <div className="container">
          <div className="max-w-2xl mb-8 sm:mb-12">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary font-medium mb-2 sm:mb-3">
              Accommodation
            </p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tight">
              Four room types. Twenty rooms.
            </h2>
            <p className="text-muted-foreground mt-3 text-base sm:text-lg">
              Choose what fits your stay — whether you&apos;re travelling solo,
              with family, or as a group.
            </p>
          </div>

          {carouselSlides.length > 0 && (
            <div className="mb-10 sm:mb-12">
              <RoomCarousel slides={carouselSlides} />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {roomTypes.map((t) => (
              <Card
                key={t.type}
                className="group hover:border-primary/50 hover:shadow-md transition-all"
              >
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Bed className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-accent/50 px-2 py-1 rounded-full font-medium">
                      {t.count} {t.count === 1 ? "room" : "rooms"}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-2xl tracking-tight">
                      {t.type}
                    </h3>
                    <p className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-1">
                      <Users className="h-3 w-3" />
                      Sleeps up to {t.capacity}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {t.description}
                  </p>
                  <div className="pt-3 border-t border-border flex items-baseline justify-between">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      From
                    </span>
                    <div>
                      <span className="font-display text-2xl font-semibold tabular-nums">
                        {formatCurrency(t.startingPrice)}
                      </span>
                      <span className="text-xs text-muted-foreground font-normal ml-1">
                        /night
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Button asChild size="lg">
              <Link href="/book">
                Check availability
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ============================== ABOUT =============================== */}
      <section id="about" className="py-14 sm:py-20 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-start">
            <div>
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary font-medium mb-2 sm:mb-3">
                About us
              </p>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tight">
                Built for pilgrims, families, and quiet travellers.
              </h2>
              <p className="text-muted-foreground mt-4 text-base sm:text-lg leading-relaxed">
                Rathi Atithi Bhawan is a 20-room guest house in Vrindavan,
                welcoming visitors who come to walk the holy lanes, attend
                aarti, and find a moment of peace.
              </p>
              <p className="text-muted-foreground mt-3 text-base leading-relaxed">
                Our rooms are clean, our staff are warm, and our prices are
                honest. Whether you&apos;re here for a night or a longer
                pilgrimage, we&apos;ll help you settle in.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: Heart, title: "Family-owned", desc: "Run with care, not by a chain." },
                { icon: MapPin, title: "Prime location", desc: "Walking distance to all major temples." },
                { icon: Star, title: "Honest pricing", desc: "What you see is what you pay." },
                { icon: Clock, title: "Always reachable", desc: "Call us anytime — we pick up." },
              ].map((b) => {
                const Icon = b.icon;
                return (
                  <div
                    key={b.title}
                    className="rounded-xl border border-border bg-card p-4 sm:p-5"
                  >
                    <Icon className="h-5 w-5 text-primary mb-2.5" />
                    <p className="font-medium text-sm">{b.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {b.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =========================== AMENITIES ============================= */}
      <section className="py-14 sm:py-20 md:py-24">
        <div className="container">
          <div className="max-w-2xl mb-8 sm:mb-12">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary font-medium mb-2 sm:mb-3">
              Every room includes
            </p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tight">
              The essentials, done right.
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            {AMENITIES.map((a) => {
              const Icon = a.icon;
              return (
                <div
                  key={a.label}
                  className="rounded-xl border border-border bg-card px-3 py-4 sm:px-4 sm:py-5 flex flex-col items-center text-center gap-2 hover:border-primary/40 transition-colors"
                >
                  <Icon className="h-6 w-6 text-primary" />
                  <span className="text-xs font-medium">{a.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================== LOCATION ============================== */}
      <section className="py-14 sm:py-20 md:py-24 bg-secondary/30">
        <div className="container max-w-3xl text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-5">
            <MapPin className="h-7 w-7 text-primary" />
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tight">
            Right where you want to be.
          </h2>
          <p className="text-muted-foreground mt-4 text-base sm:text-lg max-w-2xl mx-auto">
            Located in Vrindavan, walking distance to major temples and ghats.
            Easy access from Mathura station and Delhi by road.
          </p>
          <div className="mt-6 sm:mt-8 inline-flex flex-wrap justify-center gap-2 sm:gap-3">
            <a
              href={`tel:${PHONE_TEL}`}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-card hover:bg-muted/40 transition-colors h-11 px-5 text-sm font-medium"
            >
              <Phone className="h-4 w-4 text-primary" />
              {PHONE_DISPLAY}
            </a>
            <a
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#25D366] text-white hover:bg-[#1faa56] transition-colors h-11 px-5 text-sm font-medium"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* =========================== CONTACT FORM ========================== */}
      <section className="py-14 sm:py-20 md:py-24">
        <div className="container max-w-2xl">
          <div className="text-center mb-8 sm:mb-12">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary font-medium mb-2 sm:mb-3">
              Have a question?
            </p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tight">
              Send us a message.
            </h2>
            <p className="text-muted-foreground mt-3 text-base sm:text-lg">
              Group bookings, special requests, anything else — we&apos;ll get
              back to you.
            </p>
          </div>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
