import Link from "next/link";
import {
  ACTIVITY_CATEGORIES,
  CATEGORY_LABELS,
} from "@/lib/constants";
import type { ActivityCategory } from "@/db/schema";
import { cn } from "@/lib/utils";

export function CategoryFilters({
  active,
  basePath = "/deals",
}: {
  active?: ActivityCategory;
  basePath?: "/" | "/deals";
}) {
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

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={chip.href}
          className={cn(
            "px-3 py-1.5 font-mono text-[11px] tracking-[0.16em] uppercase",
            chip.current
              ? "bg-[var(--ink)] text-[var(--ball)]"
              : "bg-white text-[var(--ink)] ring-1 ring-[var(--ink)]/15 hover:bg-[var(--ball)]",
          )}
        >
          {chip.label}
        </Link>
      ))}
    </div>
  );
}
