"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useGroupPlan } from "@/components/group/use-group-plan";
import { ACTIVITY_CATEGORIES, CATEGORY_LABELS, DEFAULT_CITY } from "@/lib/constants";
import type { ActivityCategory } from "@/db/schema";
import { newId } from "@/lib/group-plan";

export function VenueApplyForm({ nextHref = "/club" }: { nextHref?: string }) {
  const { ready, venue, saveVenue } = useGroupPlan();
  const [error, setError] = useState<string | null>(null);

  if (!ready) {
    return <p className="text-[var(--ink)]/60">Loading…</p>;
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const name = String(data.get("name") ?? "").trim();
        const address = String(data.get("address") ?? "").trim();
        const city = String(data.get("city") ?? "").trim();
        const postalCode = String(data.get("postalCode") ?? "").trim();
        const description = String(data.get("description") ?? "").trim();
        const category = String(data.get("category") ?? "padel") as ActivityCategory;
        if (!name || !address || !city || !postalCode || !description) {
          setError("Fill in every field so guests can find you.");
          return;
        }
        saveVenue({
          id: venue?.id ?? newId("venue"),
          name,
          category,
          address,
          city,
          postalCode,
          description,
        });
        window.location.assign(nextHref);
      }}
    >
      {error ? <p className="notice-error">{error}</p> : null}
      <div className="space-y-2">
        <Label htmlFor="name">Venue name</Label>
        <Input id="name" name="name" required defaultValue={venue?.name ?? ""} placeholder="Strike Boschstraat" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Activity</Label>
        <select
          id="category"
          name="category"
          defaultValue={venue?.category ?? "bowling"}
          className="field"
        >
          {ACTIVITY_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Street</Label>
        <Input
          id="address"
          name="address"
          required
          defaultValue={venue?.address ?? ""}
          placeholder="Boschstraat 69"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" required defaultValue={venue?.city ?? DEFAULT_CITY} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postalCode">Postcode</Label>
          <Input
            id="postalCode"
            name="postalCode"
            required
            defaultValue={venue?.postalCode ?? ""}
            placeholder="6211 AV"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">What leftover time do you dump?</Label>
        <Textarea
          id="description"
          name="description"
          required
          defaultValue={venue?.description ?? ""}
          placeholder="Weeknight lanes that never fill. Groups of 4–6."
        />
      </div>
      <button type="submit" className="btn-ball h-12 w-full">
        {venue ? "Save venue" : "Create venue account"}
      </button>
    </form>
  );
}
