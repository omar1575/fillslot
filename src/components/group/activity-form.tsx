"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SquareToggle } from "@/components/group/square-toggle";
import { useGroupPlan } from "@/components/group/use-group-plan";
import { ACTIVITY_CATEGORIES, CATEGORY_LABELS, DEFAULT_CITY, RESOURCE_LABELS } from "@/lib/constants";
import type { ActivityCategory } from "@/db/schema";
import { newId } from "@/lib/group-plan";
import { amsterdamInputToUtc, utcToAmsterdamInput } from "@/lib/time";

function defaultWindow() {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(19, 0, 0, 0);
  const end = new Date(start);
  end.setHours(20, 30, 0, 0);
  return { start: utcToAmsterdamInput(start), end: utcToAmsterdamInput(end) };
}

export function ActivityForm() {
  const { venue, saveActivity, ready } = useGroupPlan();
  const slotWindow = useMemo(defaultWindow, []);
  const [evenOnly, setEvenOnly] = useState(true);
  const [flexible, setFlexible] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const category = (venue?.category ?? "bowling") as ActivityCategory;
  const unit = RESOURCE_LABELS[category];

  if (!ready) {
    return <p className="text-[var(--ink)]/60">Loading…</p>;
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const title = String(data.get("title") ?? "").trim();
        const address = String(data.get("address") ?? "").trim();
        const city = String(data.get("city") ?? "").trim();
        const postalCode = String(data.get("postalCode") ?? "").trim();
        const startsAt = String(data.get("startsAt") ?? "");
        const endsAt = String(data.get("endsAt") ?? "");
        const chosenCategory = String(data.get("category") ?? category) as ActivityCategory;
        const originalPrice = Number(data.get("originalPrice"));
        const dealPrice = Number(data.get("dealPrice"));
        const minCapacity = Math.floor(Number(data.get("minCapacity")));
        const fullCapacity = Math.floor(Number(data.get("fullCapacity")));

        if (!title || !address || !city || !postalCode || !startsAt || !endsAt) {
          setError("Fill in location, time, and the activity name.");
          return;
        }
        if (!Number.isFinite(originalPrice) || !Number.isFinite(dealPrice) || dealPrice <= 0) {
          setError("Add a usual price and a cheaper Fillslot price.");
          return;
        }
        if (dealPrice >= originalPrice) {
          setError("The discounted price must be lower than the usual price.");
          return;
        }
        if (minCapacity < 1 || fullCapacity < minCapacity) {
          setError("Full capacity has to be at least the minimum.");
          return;
        }
        if (evenOnly && (minCapacity % 2 !== 0 || fullCapacity % 2 !== 0)) {
          setError("Even-number plans need even min and full capacity.");
          return;
        }

        const startDate = amsterdamInputToUtc(startsAt);
        const endDate = amsterdamInputToUtc(endsAt);
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || !(startDate.getTime() < endDate.getTime())) {
          setError("Pick an end time after the start.");
          return;
        }

        const id = newId("plan");
        saveActivity({
          id,
          venueId: venue?.id ?? "venue_local",
          venueName: venue?.name ?? "Your venue",
          category: chosenCategory,
          title,
          address,
          city,
          postalCode,
          startsAt: startDate.toISOString(),
          endsAt: endDate.toISOString(),
          originalPriceCents: Math.round(originalPrice * 100),
          dealPriceCents: Math.round(dealPrice * 100),
          minCapacity,
          fullCapacity,
          evenOnly,
          flexible,
          listedByYou: true,
        });
        window.location.assign("/club");
      }}
    >
      {error ? <p className="notice-error">{error}</p> : null}
      {!venue ? (
        <p className="notice-warn !bg-[var(--glass)] !text-[var(--ink)]">
          No venue on this device yet. We will list this under “Your venue” until you{" "}
          <Link className="underline" href="/club">
            create the venue
          </Link>
          .
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="title" className="capitalize">
          {unit} / activity name
        </Label>
        <Input id="title" name="title" required placeholder="Lane 3" defaultValue={unit === "lane" ? "Lane 3" : ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <select id="category" name="category" defaultValue={category} className="field">
          {ACTIVITY_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {CATEGORY_LABELS[item]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Location</Label>
        <Input
          id="address"
          name="address"
          required
          defaultValue={venue?.address ?? ""}
          placeholder="Street and number"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" required defaultValue={venue?.city ?? DEFAULT_CITY} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postalCode">Postcode</Label>
          <Input id="postalCode" name="postalCode" required defaultValue={venue?.postalCode ?? ""} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startsAt">Starts (Amsterdam)</Label>
          <Input id="startsAt" name="startsAt" type="datetime-local" required defaultValue={slotWindow.start} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endsAt">Ends</Label>
          <Input id="endsAt" name="endsAt" type="datetime-local" required defaultValue={slotWindow.end} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="originalPrice">Usual price (€ each)</Label>
          <Input
            id="originalPrice"
            name="originalPrice"
            type="number"
            min="1"
            step="0.01"
            defaultValue="28"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dealPrice">Discounted price (€ each)</Label>
          <Input id="dealPrice" name="dealPrice" type="number" min="1" step="0.01" defaultValue="18" required />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="minCapacity">Min capacity</Label>
          <Input id="minCapacity" name="minCapacity" type="number" min="1" step="1" defaultValue="4" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fullCapacity">Full capacity</Label>
          <Input id="fullCapacity" name="fullCapacity" type="number" min="1" step="1" defaultValue="6" required />
        </div>
      </div>
      <SquareToggle
        checked={evenOnly}
        onChange={setEvenOnly}
        label="Even number of participants"
        hint="Padel, bowling doubles — odd groups cannot hold this plan."
      />
      <SquareToggle
        checked={flexible}
        onChange={setFlexible}
        label="Flexible if the group is short"
        hint="Lets people go anyway and split the gap, e.g. bowl with 3 at €2 more each."
      />
      <button type="submit" className="btn-ball h-12 w-full">
        Publish activity
      </button>
    </form>
  );
}
