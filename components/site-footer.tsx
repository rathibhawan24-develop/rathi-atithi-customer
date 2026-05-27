import Link from "next/link";
import { MapPin, Phone, Mail, MessageCircle } from "lucide-react";

// TODO: these are pulled from the admin /settings page once filled in.
// Until then, edit here directly or wire up runtime fetching from settings.
const CONTACT = {
  phone: "+91 00000 00000",
  email: "stay@rathiatithibhawan.com",
  whatsapp: "919000000000",
  address: "Vrindavan, Mathura, Uttar Pradesh",
};

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/30 mt-24">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <p className="font-display text-2xl tracking-tight">
              Rathi Atithi Bhawan
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Comfort & devotion in the heart of Vrindavan. A peaceful stay for
              pilgrims and families.
            </p>
          </div>

          <div id="contact">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
              Contact
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <span>{CONTACT.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <a
                  href={`tel:${CONTACT.phone}`}
                  className="hover:text-primary transition-colors"
                >
                  {CONTACT.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="hover:text-primary transition-colors"
                >
                  {CONTACT.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 shrink-0 text-primary" />
                <a
                  href={`https://wa.me/${CONTACT.whatsapp}`}
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
            © {new Date().getFullYear()} Rathi Atithi Bhawan. All rights reserved.
          </p>
          <p>Check-in 12:00 PM · Check-out 11:00 AM</p>
        </div>
      </div>
    </footer>
  );
}
