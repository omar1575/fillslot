"use client";

import Link from "next/link";
import { useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ACTIVITY_CATEGORIES,
  CATEGORY_LABELS,
} from "@/lib/constants";
import type { ActivityCategory } from "@/db/schema";
import { cn } from "@/lib/utils";

let savedScroll: number | null = null;

export function CategoryFilters({
  active,
  basePath = "/deals",
}: {
  active?: ActivityCategory;
  basePath?: "/" | "/deals";
}) {
  const router = useRouter();
  const chips = [
    {
      href: basePath,
      label: "All",
      key: "all",
      current: !active,
    },
    ...ACTIVITY_CATEGORIES.map((category) => ({
      href: `${basePath}?category=${category}`,
      label: CATEGORY_LABELS[category],
      key: category,
      current: active === category,
    })),
  ];

  useLayoutEffect(() => {
    if (savedScroll === null) return;
    const y = savedScroll;
    savedScroll = null;
    window.scrollTo(0, y);
    const frame = requestAnimationFrame(() => window.scrollTo(0, y));
    return () => cancelAnimationFrame(frame);
  }, [active]);

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={chip.href}
          scroll={false}
          onClick={(event) => {
            if (
              event.button !== 0 ||
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey
            ) {
              return;
            }
            event.preventDefault();
            savedScroll = window.scrollY;
            router.push(chip.href, { scroll: false });
          }}
          className={cn(
            "px-3 py-1.5 font-mono text-[11px] tracking-[0.16em] uppercase",
            chip.current
              ? "bg-[var(--ink)] text-[var(--ball)]"
              : "bg-[var(--ticket)] text-[var(--ink)] ring-1 ring-[var(--ink)]/15 hover:bg-[var(--ball)]",
          )}
        >
          {chip.label}
        </Link>
      ))}
    </div>
  );
}
