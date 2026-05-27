import Link from "next/link";
import Image from "next/image";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-black p-1 shrink-0 shadow-sm">
            <Image
              src="/logo.png"
              alt="Rathi Atithi Bhawan logo"
              width={44}
              height={44}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-xl tracking-tight">
              Rathi Atithi Bhawan
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
              Vrindavan
            </span>
          </div>
        </Link>

        <nav className="hidden sm:flex items-center gap-7 text-sm">
          <Link
            href="/#rooms"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Rooms
          </Link>
          <Link
            href="/#about"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            About
          </Link>
          <Link
            href="/#contact"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Contact
          </Link>
          <Link
            href="/my-booking"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            My booking
          </Link>
        </nav>

        <Link
          href="/book"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 h-10 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Book now
        </Link>
      </div>
    </header>
  );
}
