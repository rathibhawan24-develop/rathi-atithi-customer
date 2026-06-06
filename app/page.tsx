import Link from "next/link";
import {
  Bed,
  Users,
  Wifi,
  Wind,
  ShowerHead,
  MapPin,
  Sparkles,
  Heart,
  ChevronRight,
  ShieldCheck,
  IndianRupee,
  Clock,
  Utensils,
  BookOpen,
  Car,
  Plane,
  Compass,
  Glasses,
  Shirt,
  Zap,
  Droplets,
  Coffee,
  Route,
  Cake,
  Music,
  Flower2,
  Landmark,
  HandHeart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/primitives";
import { ContactForm } from "@/components/contact-form";
import { ContactButtons } from "@/components/contact-buttons";
import { PropertyGallery } from "@/components/property-gallery";
import { HeroSearch } from "@/components/hero-search";
import { RoomCarousel, type CarouselSlide } from "@/components/room-carousel";
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
    "Comfortable AC rooms for couples and solo pilgrims, with all essentials for a restful stay.",
  "4 Bed":
    "Spacious AC rooms ideal for small families, accommodating up to 4 guests in comfort.",
  Deluxe:
    "Premium AC rooms with extra space — perfect for couples seeking added comfort.",
  "Sudama 6 Bed":
    "Our largest room — designed for groups, joint families, and group yatras. Sleeps up to 6.",
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

// =============================================================================
// CONTENT — sourced from owner's brief; edit here to tweak copy.
// =============================================================================

const TRUST_SIGNALS = [
  { icon: Landmark, label: "100-year heritage Bhavan" },
  { icon: Wind, label: "All AC rooms" },
  { icon: Utensils, label: "Pure Satvik dining" },
  { icon: MapPin, label: "Walking to all temples" },
];

const TEMPLES = [
  { name: "Shri Rangji Temple", minutes: 3 },
  { name: "Tatiya Sthan", minutes: 7 },
  { name: "Sudama Kuti", minutes: 8 },
  { name: "Malook Peeth", minutes: 8 },
  { name: "Jagannath Temple", minutes: 8 },
  { name: "Shri Radha Raman Temple", minutes: 10 },
  { name: "Nidhivan", minutes: 12 },
  { name: "Keshi Ghat (Yamuna Aarti)", minutes: 13 },
  { name: "Radha Vallabh Temple", minutes: 20 },
  { name: "Banke Bihari Temple", minutes: 25 },
];

const AMENITIES = [
  { icon: Wind, label: "All-AC rooms" },
  { icon: Utensils, label: "Satvik dining" },
  { icon: BookOpen, label: "Spiritual library" },
  { icon: Wifi, label: "Free Wi-Fi" },
  { icon: ShowerHead, label: "Hot water" },
  { icon: Droplets, label: "24-hr RO water" },
  { icon: Zap, label: "Power backup" },
  { icon: Coffee, label: "Tea, coffee & snacks" },
  { icon: Shirt, label: "Laundry service" },
  { icon: Bed, label: "Daily housekeeping" },
  { icon: Sparkles, label: "Room service" },
  { icon: Glasses, label: "VR Vrindavan tour" },
];

const SERVICES = [
  {
    icon: Car,
    title: "On-demand cab & auto",
    desc: "Travel comfortably across Braj — arranged at the front desk.",
  },
  {
    icon: Plane,
    title: "Airport & station shuttle",
    desc: "To-and-fro pickup from Delhi airport or Mathura railway station.",
  },
  {
    icon: Compass,
    title: "In-house guide",
    desc: "A knowledgeable guide to walk you through the lanes of Braj.",
  },
  {
    icon: Glasses,
    title: "Web VR experience",
    desc: "Tour Vrindavan in immersive VR with Meta Quest, available on request.",
  },
];

const PACKAGES = [
  {
    icon: Route,
    duration: "7 days",
    title: "84 Kos Braj Yatra",
    desc: "The complete circumambulation of Braj — 84 kos of sacred ground.",
  },
  {
    icon: Route,
    duration: "5 days / 4 nights",
    title: "Six-town Braj Darshan",
    desc: "Vrindavan, Mathura, Gokul, Barsana, Govardhan, Nandgaon.",
  },
  {
    icon: Route,
    duration: "2 days",
    title: "Mathura & Vrindavan Darshan",
    desc: "A focused weekend covering the core temples of both towns.",
  },
  {
    icon: Flower2,
    duration: "Anytime",
    title: "Chunri Manorath",
    desc: "Sacred chunri offering and rituals for Shri Yamuna Ji.",
  },
  {
    icon: Music,
    duration: "On request",
    title: "Katha, Kirtan & Satsang",
    desc: "Arrangements for devotional gatherings and discourses.",
  },
  {
    icon: Sparkles,
    duration: "On request",
    title: "Raas Leela & Ram Leela",
    desc: "Traditional Braj performances curated for your group.",
  },
  {
    icon: Cake,
    duration: "Custom",
    title: "Birthdays & anniversaries",
    desc: "Mark special days with a celebration in the heart of Braj.",
  },
  {
    icon: HandHeart,
    duration: "Custom",
    title: "Family get-togethers",
    desc: "Plan a private spiritual or family gathering on our property.",
  },
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
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.18em] sm:tracking-[0.3em] text-primary font-medium">
              <span className="whitespace-nowrap">Gyan Gudadi</span>
              <span className="mx-1.5 text-primary/50">·</span>
              <span className="whitespace-nowrap">Old Vrindavan</span>
              <span className="mx-1.5 text-primary/50">·</span>
              <span className="whitespace-nowrap">On the banks of Maa Yamuna</span>
            </p>
            <h1 className="font-display text-[2rem] leading-[1.1] sm:text-5xl md:text-6xl sm:leading-[1.05] tracking-tight mt-3 sm:mt-4">
              A divine stay in the heart of Old Vrindavan.
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-3 sm:mt-4 max-w-xl mx-auto leading-relaxed">
              A 100-year-old heritage Bhavan, lovingly restored for pilgrims
              and families. Walking distance to every major temple.
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

      {/* ============================== ABOUT =============================== */}
      <section id="about" className="py-14 sm:py-20 md:py-24 bg-secondary/30">
        <div className="container max-w-4xl">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary font-medium mb-2 sm:mb-3">
              Our Bhavan
            </p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tight">
              A living scripture of devotion.
            </h2>
          </div>

          {/* Property gallery — only renders if photos have been uploaded */}
          <div className="mb-10 sm:mb-14">
            <PropertyGallery />
          </div>

          <div className="space-y-6 text-base sm:text-lg text-muted-foreground leading-relaxed">
            <p>
              Our Bhavan is gracefully situated in the sacred region of Old
              Vrindavan, on the holy banks of Maa Yamuna, in the spiritually
              significant area of{" "}
              <span className="text-foreground font-medium">Gyan Gudadi</span>{" "}
              — the very place where Uddhav Ji is believed to have received
              the profound wisdom of divine love from the Gopis. This land is
              not merely a geographical location; it is a living scripture of
              devotion, surrender, and pure bhakti.
            </p>
            <p>
              Nestled in the serene Kunj lane of Vrindavan, our Bhavan stands
              at the spiritual center of the town. All major temples and
              sacred pilgrimage sites — Shri Rangji Temple, Radha Raman
              Temple, Banke Bihari Temple, Tatiya Sthan, Sudama Kuti, and many
              more — are within comfortable walking distance.
            </p>
            <p>
              This nearly 100-year-old heritage property carries the timeless
              charm of traditional Braj architecture. Recently renovated with
              devotion and care, the Bhavan harmoniously blends its heritage
              beauty with all modern comforts — preserving its sacred essence
              while ensuring a peaceful, hygienic, and comfortable stay.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10 sm:mt-14">
            {[
              {
                icon: Landmark,
                title: "Heritage",
                desc: "Nearly 100 years old, lovingly restored.",
              },
              {
                icon: HandHeart,
                title: "Atithi Devo Bhava",
                desc: "Every guest, a form of the Divine.",
              },
              {
                icon: Utensils,
                title: "Satvik Bhojan",
                desc: "Pure, no onion or garlic.",
              },
              {
                icon: BookOpen,
                title: "In-house library",
                desc: "Devotional and spiritual books.",
              },
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
      </section>

      {/* ============================= ROOMS GRID ============================ */}
      <section id="rooms" className="py-14 sm:py-20 md:py-24">
        <div className="container">
          <div className="max-w-2xl mb-8 sm:mb-12">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary font-medium mb-2 sm:mb-3">
              Accommodation
            </p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tight">
              Premium & deluxe rooms, all AC.
            </h2>
            <p className="text-muted-foreground mt-3 text-base sm:text-lg leading-relaxed">
              From 2-bed rooms for couples to a 6-bed Sudama Kuti for groups —
              we host up to 50 guests, perfect for families, group yatras,
              spiritual retreats, and satsang gatherings.
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

      {/* ===================== WALKING DISTANCE TO TEMPLES =================== */}
      <section className="py-14 sm:py-20 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="max-w-2xl mb-8 sm:mb-12">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary font-medium mb-2 sm:mb-3">
              Prime location
            </p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tight">
              Walking distance to every major temple.
            </h2>
            <p className="text-muted-foreground mt-3 text-base sm:text-lg leading-relaxed">
              Old Vrindavan, where every lane leads to a sacred site. Step out
              of our Bhavan and you&apos;re minutes from where bhakti began.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TEMPLES.map((t) => (
              <div
                key={t.name}
                className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3.5 hover:border-primary/40 transition-colors"
              >
                <div className="h-11 w-11 shrink-0 rounded-full bg-primary/10 flex flex-col items-center justify-center leading-none">
                  <span className="font-display text-base font-semibold text-primary tabular-nums">
                    {t.minutes}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-primary/70 mt-0.5">
                    min
                  </span>
                </div>
                <p className="text-sm font-medium leading-tight">{t.name}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-center mt-8 italic">
            Times are approximate walking distances. Rickshaw or auto is faster.
          </p>
        </div>
      </section>

      {/* =========================== AMENITIES ============================= */}
      <section className="py-14 sm:py-20 md:py-24">
        <div className="container">
          <div className="max-w-2xl mb-8 sm:mb-12">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary font-medium mb-2 sm:mb-3">
              Every stay includes
            </p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tight">
              Comfort, devotion, and care.
            </h2>
            <p className="text-muted-foreground mt-3 text-base sm:text-lg leading-relaxed">
              Heritage charm with modern essentials. Pure Satvik meals prepared
              with devotion. Clean, quiet, well-kept.
            </p>
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
                  <span className="text-xs font-medium leading-tight">
                    {a.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Concierge / on-demand services */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-8 sm:mt-10">
            {SERVICES.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <Icon className="h-5 w-5 text-primary mb-2.5" />
                  <p className="font-medium text-sm">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================== SPIRITUAL PACKAGES & CELEBRATIONS ================ */}
      <section className="py-14 sm:py-20 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="max-w-2xl mb-8 sm:mb-12">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary font-medium mb-2 sm:mb-3">
              Curated experiences
            </p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tight">
              Yatras, celebrations & satsang.
            </h2>
            <p className="text-muted-foreground mt-3 text-base sm:text-lg leading-relaxed">
              More than rooms — we help you live Braj. From the 84 Kos Yatra
              to private Kathas, we&apos;ll arrange every detail.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PACKAGES.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-accent/50 px-2 py-1 rounded-full font-medium">
                      {p.duration}
                    </span>
                  </div>
                  <h3 className="font-display text-lg tracking-tight">
                    {p.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Have something else in mind? We arrange custom spiritual and
              family gatherings too.
            </p>
            <Button asChild variant="outline">
              <Link href="#contact">
                Talk to us
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ====================== ATITHI DEVO BHAVA PROMISE ==================== */}
      <section className="py-14 sm:py-20 md:py-24">
        <div className="container max-w-3xl text-center">
          <Flower2 className="h-8 w-8 text-primary/60 mx-auto mb-5" />
          <p className="font-display italic text-primary text-2xl sm:text-3xl tracking-tight">
            अतिथि देवो भव:
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tight mt-4">
            Every guest, a form of the Divine.
          </h2>
          <p className="text-muted-foreground mt-5 text-base sm:text-lg leading-relaxed">
            Cleanliness, discipline, warmth, and respectful service are the
            foundations of our hospitality. Our team serves with humility and
            devotion — because we believe in the principle of{" "}
            <span className="text-foreground font-medium">
              Atithi Devo Bhava
            </span>
            .
          </p>
          <p className="text-muted-foreground mt-5 text-sm sm:text-base italic leading-relaxed">
            Our Bhavan is not merely a place to stay. For those seeking
            spiritual proximity, divine association, peace, and devotion — it
            is a sacred home away from home.
          </p>
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
          <p className="text-muted-foreground mt-4 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Gyan Gudadi, Old Vrindavan. A short walk to Keshi Ghat for the
            Yamuna aarti. Easy access from Mathura railway station and from
            Delhi by road.
          </p>
          <ContactButtons />
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
              Group bookings, yatra planning, satsang arrangements — we&apos;ll
              get back to you.
            </p>
          </div>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
