"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/primitives";
import { todayIso, addDaysIso } from "@/lib/utils";

export function HeroSearch() {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState(todayIso());
  const [checkOut, setCheckOut] = useState(addDaysIso(todayIso(), 1));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({ checkIn, checkOut });
    router.push(`/book?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="rounded-2xl bg-card border border-border shadow-xl p-4 sm:p-5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 sm:gap-4 items-end">
        <div className="space-y-1.5">
          <Label
            htmlFor="hs_ci"
            className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-1"
          >
            <CalendarDays className="h-3 w-3" />
            Check-in
          </Label>
          <Input
            id="hs_ci"
            type="date"
            min={todayIso()}
            value={checkIn}
            onChange={(e) => {
              setCheckIn(e.target.value);
              if (e.target.value && checkOut <= e.target.value) {
                setCheckOut(addDaysIso(e.target.value, 1));
              }
            }}
            className="h-12 text-base"
          />
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="hs_co"
            className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-1"
          >
            <CalendarDays className="h-3 w-3" />
            Check-out
          </Label>
          <Input
            id="hs_co"
            type="date"
            min={checkIn ? addDaysIso(checkIn, 1) : todayIso()}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="h-12 text-base"
          />
        </div>
        <Button type="submit" size="lg" className="h-12 text-base sm:w-auto w-full">
          <Search />
          Find rooms
        </Button>
      </div>
    </form>
  );
}
