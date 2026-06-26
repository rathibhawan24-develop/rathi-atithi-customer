"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePublicSettings, telHref } from "@/lib/use-public-settings";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const LINKS = [
  { href: "/#rooms", label: "Rooms" },
  { href: "/#about", label: "About" },
  { href: "/#contact", label: "Contact" },
  { href: "/my-booking", label: "My booking" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const settings = usePublicSettings();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="container flex items-center justify-between h-20 sm:h-24">
        <Link
          href="/"
          className="flex items-center gap-3 sm:gap-4"
          onClick={() => setOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${BASE_PATH}/logo.png`}
            alt={`${settings.hotel_name} logo`}
            className="h-14 sm:h-16 w-auto object-contain shrink-0"
          />
          <div className="flex flex-col leading-tight">
            <span className="font-display text-base sm:text-lg tracking-tight">
              {settings.hotel_name}
            </span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              Vrindavan
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-7 text-sm">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Phone — visible on tablet+, icon-only on mobile */}
          <a
            href={telHref(settings.contact_phone)}
            className="hidden sm:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-2"
            aria-label="Call us"
          >
            <Phone className="h-4 w-4" />
            <span className="hidden md:inline">{settings.contact_phone}</span>
          </a>
          <a
            href={telHref(settings.contact_phone)}
            className="sm:hidden inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-muted transition-colors"
            aria-label="Call us"
          >
            <Phone className="h-5 w-5 text-primary" />
          </a>

          <Link
            href="/book"
            className="hidden sm:inline-flex items-center justify-center rounded-md bg-primary px-4 h-10 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            onClick={() => setOpen(false)}
          >
            Book now
          </Link>

          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-muted transition-colors"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      <div
        className={cn(
          "lg:hidden border-t border-border bg-background overflow-hidden transition-all",
          open ? "max-h-96" : "max-h-0"
        )}
      >
        <nav className="container py-2 flex flex-col">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="py-3 px-2 text-sm hover:bg-muted rounded-md transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/book"
            onClick={() => setOpen(false)}
            className="my-2 inline-flex items-center justify-center rounded-md bg-primary px-4 h-11 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors sm:hidden"
          >
            Book now
          </Link>
        </nav>
      </div>
    </header>
  );
}
