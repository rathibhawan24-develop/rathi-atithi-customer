"use client";

import Link from "next/link";
import { MapPin, Phone, Mail, MessageCircle } from "lucide-react";
import {
  usePublicSettings,
  telHref,
  waHref,
  mailHref,
  formatTime12h,
} from "@/lib/use-public-settings";

export function SiteFooter() {
  const s = usePublicSettings();

  return (
    <footer className="border-t border-border bg-secondary/30 mt-24">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <p className="font-display text-2xl tracking-tight">
              {s.hotel_name}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {s.hotel_tagline}
            </p>
          </div>

          <div id="contact">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
              Contact
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <span>{s.hotel_address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <a
                  href={telHref(s.contact_phone)}
                  className="hover:text-primary transition-colors"
                >
                  {s.contact_phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <a
                  href={mailHref(s.contact_email)}
                  className="hover:text-primary transition-colors"
                >
                  {s.contact_email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 shrink-0 text-primary" />
                <a
                  href={waHref(s.whatsapp_number)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  WhatsApp us
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
              Explore
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="hover:text-primary transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/#rooms"
                  className="hover:text-primary transition-colors"
                >
                  Rooms
                </Link>
              </li>
              <li>
                <Link
                  href="/book"
                  className="hover:text-primary transition-colors"
                >
                  Book a stay
                </Link>
              </li>
              <li>
                <Link
                  href="/my-booking"
                  className="hover:text-primary transition-colors"
                >
                  Check my booking
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {s.hotel_name}. All rights reserved.
          </p>
          <p>
            Check-in {formatTime12h(s.check_in_time)} · Check-out{" "}
            {formatTime12h(s.check_out_time)}
          </p>
        </div>
      </div>
    </footer>
  );
}
