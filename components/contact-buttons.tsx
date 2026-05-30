"use client";

import { Phone, MessageCircle } from "lucide-react";
import { usePublicSettings, telHref, waHref } from "@/lib/use-public-settings";

// Phone + WhatsApp buttons for the Location section on the landing page.
// Pulled out into a client component so the rest of the page can stay
// statically rendered while these reflect the latest admin settings.
export function ContactButtons() {
  const s = usePublicSettings();
  return (
    <div className="mt-6 sm:mt-8 inline-flex flex-wrap justify-center gap-2 sm:gap-3">
      <a
        href={telHref(s.contact_phone)}
        className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-card hover:bg-muted/40 transition-colors h-11 px-5 text-sm font-medium"
      >
        <Phone className="h-4 w-4 text-primary" />
        {s.contact_phone}
      </a>
      <a
        href={waHref(s.whatsapp_number)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-md bg-[#25D366] text-white hover:bg-[#1faa56] transition-colors h-11 px-5 text-sm font-medium"
      >
        <MessageCircle className="h-4 w-4" />
        WhatsApp
      </a>
    </div>
  );
}
