"use client";

import { cn } from "@/lib/utils";

export function SquareToggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start justify-between gap-4 border border-[var(--ink)]/15 bg-[var(--ticket)] px-4 py-3 text-left"
    >
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint ? <span className="mt-1 block text-sm text-[var(--ink)]/60">{hint}</span> : null}
      </span>
      <span
        className={cn(
          "relative mt-0.5 h-7 w-12 shrink-0 border border-[var(--ink)]",
          checked ? "bg-[var(--ball)]" : "bg-[var(--wall)]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 bg-[var(--ink)] transition-transform",
            checked ? "left-6" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}
