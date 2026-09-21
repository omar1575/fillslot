"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { bookSlotAction } from "@/app/actions/book";
import type { ActivityCategory } from "@/db/schema";
import { isTicketCategory, resourceLabel } from "@/lib/constants";
import { formatEuro } from "@/lib/money";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-12 w-full bg-[var(--ball)] font-display text-lg text-[var(--ink)] shadow-[4px_4px_0_var(--ink)] hover:brightness-95 disabled:opacity-50"
    >
      {pending ? "Holding leftover…" : label}
    </button>
  );
}

export function BookForm({
  slotId,
  category,
  unitPriceCents,
  remaining,
  disabled,
}: {
  slotId: string;
  category: ActivityCategory;
  unitPriceCents: number;
  remaining: number;
  disabled?: boolean;
}) {
  const ticketed = isTicketCategory(category);
  const [quantity, setQuantity] = useState(1);
  const qty = ticketed ? Math.min(remaining, Math.max(1, quantity)) : 1;
  const total = unitPriceCents * qty;
  const label = disabled
    ? "No longer available"
    : `Book for ${formatEuro(total)}`;

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className="h-12 w-full bg-white/20 font-display text-lg text-white/70"
      >
        {label}
      </button>
    );
  }

  return (
    <form action={bookSlotAction} className="space-y-4">
      <input type="hidden" name="slotId" value={slotId} />
      {ticketed ? (
        <div>
          <label htmlFor="quantity" className="font-mono text-[11px] tracking-[0.16em] uppercase text-white/60">
            {resourceLabel(category, 2)}
          </label>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              className="size-10 bg-white/10 text-xl"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              aria-label="Fewer tickets"
            >
              −
            </button>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min={1}
              max={remaining}
              value={qty}
              onChange={(event) => setQuantity(Number(event.target.value))}
              className="h-10 w-20 bg-white text-center text-[var(--ink)]"
            />
            <button
              type="button"
              className="size-10 bg-white/10 text-xl"
              onClick={() => setQuantity((value) => Math.min(remaining, value + 1))}
              aria-label="More tickets"
            >
              +
            </button>
            <p className="text-sm text-white/65">
              {remaining} {resourceLabel(category, remaining)} left
            </p>
          </div>
        </div>
      ) : (
        <input type="hidden" name="quantity" value="1" />
      )}
      <Submit label={label} />
    </form>
  );
}
