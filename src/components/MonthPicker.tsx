"use client";

import { CalendarDays } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function MonthPicker({ month }: { month: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  return (
    <label className={`month-picker ${pending ? "pending" : ""}`}>
      <CalendarDays size={17} />
      <input
        type="month"
        value={month}
        onChange={(event) => {
          const next = new URLSearchParams(params.toString());
          next.set("month", event.target.value);
          startTransition(() => router.push(`${pathname}?${next.toString()}`));
        }}
        aria-label="Choose month"
      />
    </label>
  );
}
