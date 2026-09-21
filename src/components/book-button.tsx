"use client";

import { useFormStatus } from "react-dom";
import { bookSlotAction } from "@/app/actions/book";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-12 w-full bg-[var(--ball)] font-display text-lg text-[var(--ink)] shadow-[4px_4px_0_var(--ink)] hover:brightness-95 disabled:opacity-50"
    >
      {pending ? "Holding the court…" : label}
    </button>
  );
}

export function BookButton({
  slotId,
  label,
  disabled,
}: {
  slotId: string;
  label: string;
  disabled?: boolean;
}) {
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
    <form action={bookSlotAction.bind(null, slotId)}>
      <Submit label={label} />
    </form>
  );
}
