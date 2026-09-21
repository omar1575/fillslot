"use client";

import { useActionState, useMemo, useState, type ReactNode } from "react";
import { completeMerchantOnboardingAction } from "@/app/actions/merchant-onboarding";
import type { ActivityCategory, FillMode } from "@/db/schema";
import {
  ACTIVITY_CATEGORIES,
  CATEGORY_FILL_DEFAULTS,
  CATEGORY_LABELS,
  WEEKDAYS,
} from "@/lib/constants";

type WindowDraft = {
  weekday: number;
  start: string;
  end: string;
  sessionMinutes: number;
  originalPrice: string;
  dealPrice: string;
  fillMode: FillMode;
  minPartySize: number;
  capacity: number;
};

function Chip({
  pressed,
  children,
  onClick,
}: {
  pressed: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`min-h-12 border px-4 py-3 text-left text-sm transition-colors ${
        pressed
          ? "border-[var(--ink)] bg-[var(--ball)] text-[var(--ink)]"
          : "border-[var(--ink)]/20 bg-[var(--ticket)] hover:border-[var(--ink)]/50"
      }`}
    >
      {children}
    </button>
  );
}

function defaultWindow(category: ActivityCategory): WindowDraft {
  const defaults = CATEGORY_FILL_DEFAULTS[category];
  return {
    weekday: 2,
    start: defaults.start,
    end: defaults.end,
    sessionMinutes: defaults.sessionMinutes,
    originalPrice: defaults.originalPrice,
    dealPrice: defaults.dealPrice,
    fillMode: defaults.fillMode,
    minPartySize: defaults.minPartySize,
    capacity: defaults.capacity,
  };
}

function fillHint(window: WindowDraft) {
  if (window.fillMode === "exact") {
    return `Needs exactly ${window.capacity} ${window.capacity === 1 ? "person" : "people"} or it does not run.`;
  }
  if (window.fillMode === "threshold") {
    return `Runs if at least ${window.minPartySize} join, up to ${window.capacity}.`;
  }
  return window.capacity > 1
    ? `Sells up to ${window.capacity} leftover spots.`
    : "One leftover window. First guest to pay takes it.";
}

export function MerchantOnboardingForm({
  initialName,
  initialSummary,
  initialAddress,
  initialPostalCode,
  initialCity,
  initialCategory,
  initialWindows,
}: {
  initialName?: string;
  initialSummary?: string;
  initialAddress?: string;
  initialPostalCode?: string;
  initialCity?: string;
  initialCategory?: ActivityCategory;
  initialWindows?: WindowDraft[];
}) {
  const [state, action, pending] = useActionState(completeMerchantOnboardingAction, null);
  const [name, setName] = useState(initialName ?? "");
  const [summary, setSummary] = useState(initialSummary ?? "");
  const [address, setAddress] = useState(initialAddress ?? "");
  const [postalCode, setPostalCode] = useState(initialPostalCode ?? "");
  const [city, setCity] = useState(initialCity ?? "Maastricht");
  const [category, setCategory] = useState<ActivityCategory>(initialCategory ?? "padel");
  const [windows, setWindows] = useState<WindowDraft[]>(
    initialWindows && initialWindows.length > 0 ? initialWindows : [defaultWindow(initialCategory ?? "padel")],
  );

  const categoryDefault = useMemo(() => defaultWindow(category), [category]);

  function setCategoryAndDefaults(next: ActivityCategory) {
    setCategory(next);
    setWindows((current) => {
      if (current.length === 1) return [defaultWindow(next)];
      return current.map((window) => ({
        ...window,
        fillMode: CATEGORY_FILL_DEFAULTS[next].fillMode,
        minPartySize: CATEGORY_FILL_DEFAULTS[next].minPartySize,
        capacity: CATEGORY_FILL_DEFAULTS[next].capacity,
        sessionMinutes: CATEGORY_FILL_DEFAULTS[next].sessionMinutes,
      }));
    });
  }

  function updateWindow(index: number, patch: Partial<WindowDraft>) {
    setWindows((current) => current.map((window, i) => (i === index ? { ...window, ...patch } : window)));
  }

  return (
    <form action={action} className="mt-8 space-y-10">
      <input type="hidden" name="windowCount" value={windows.length} />
      <input type="hidden" name="category" value={category} />
      {windows.map((window, index) => (
        <div key={index}>
          <input type="hidden" name={`windows.${index}.weekday`} value={window.weekday} />
          <input type="hidden" name={`windows.${index}.fillMode`} value={window.fillMode} />
        </div>
      ))}

      <section>
        <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--ink)]/45">
          01 · Venue
        </p>
        <h2 className="mt-2 font-display text-2xl">What do you run?</h2>
        <label htmlFor="name" className="mt-4 block text-sm text-[var(--ink)]/60">
          Venue name
        </label>
        <input
          id="name"
          name="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Plaza Padel Maastricht"
          className="mt-1 h-12 w-full border border-[var(--ink)]/20 bg-[var(--ticket)] px-3 text-base outline-none focus-visible:border-[var(--ink)]"
        />
        <label htmlFor="summary" className="mt-4 block text-sm text-[var(--ink)]/60">
          Short summary
        </label>
        <textarea
          id="summary"
          name="summary"
          required
          minLength={20}
          maxLength={600}
          rows={4}
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          placeholder="Nine indoor courts on Heerderweg. Off-peak hours that would sit empty go on Fillslot at about half the usual court rate."
          className="mt-1 w-full border border-[var(--ink)]/20 bg-[var(--ticket)] px-3 py-3 text-base outline-none focus-visible:border-[var(--ink)]"
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="address" className="block text-sm text-[var(--ink)]/60">
              Street
            </label>
            <input
              id="address"
              name="address"
              required
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Heerderweg 146"
              className="mt-1 h-12 w-full border border-[var(--ink)]/20 bg-[var(--ticket)] px-3 text-base outline-none focus-visible:border-[var(--ink)]"
            />
          </div>
          <div>
            <label htmlFor="postalCode" className="block text-sm text-[var(--ink)]/60">
              Postcode
            </label>
            <input
              id="postalCode"
              name="postalCode"
              required
              value={postalCode}
              onChange={(event) => setPostalCode(event.target.value)}
              placeholder="6224 LJ"
              className="mt-1 h-12 w-full border border-[var(--ink)]/20 bg-[var(--ticket)] px-3 text-base outline-none focus-visible:border-[var(--ink)]"
            />
          </div>
        </div>
        <input type="hidden" name="city" value={city} />
        <p className="mt-2 font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--ink)]/40">
          {city}
        </p>
      </section>

      <section>
        <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--ink)]/45">
          02 · Category
        </p>
        <h2 className="mt-2 font-display text-2xl">Pick the leftover you dump</h2>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ACTIVITY_CATEGORIES.map((item) => (
            <Chip key={item} pressed={category === item} onClick={() => setCategoryAndDefaults(item)}>
              {CATEGORY_LABELS[item]}
            </Chip>
          ))}
        </div>
      </section>

      <section>
        <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--ink)]/45">
          03 · Leftover week
        </p>
        <h2 className="mt-2 font-display text-2xl">When can people fill a leftover?</h2>
        <p className="mt-1 text-sm text-[var(--ink)]/60">
          From this time to that time, in sessions of {categoryDefault.sessionMinutes} minutes — deal
          price next to the usual price so guests see the cut.
        </p>
        <div className="mt-6 space-y-6">
          {windows.map((window, index) => (
            <div key={index} className="border border-[var(--ink)]/12 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--ink)]/45">
                  Window {index + 1}
                </p>
                {windows.length > 1 ? (
                  <button
                    type="button"
                    className="text-sm text-[var(--turf)] underline"
                    onClick={() => setWindows((current) => current.filter((_, i) => i !== index))}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => (
                  <Chip
                    key={day.id}
                    pressed={window.weekday === day.id}
                    onClick={() => updateWindow(index, { weekday: day.id })}
                  >
                    {day.short}
                  </Chip>
                ))}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <label className="text-sm text-[var(--ink)]/60">
                  From
                  <input
                    name={`windows.${index}.start`}
                    type="time"
                    required
                    value={window.start}
                    onChange={(event) => updateWindow(index, { start: event.target.value })}
                    className="mt-1 h-11 w-full border border-[var(--ink)]/20 bg-[var(--ticket)] px-3"
                  />
                </label>
                <label className="text-sm text-[var(--ink)]/60">
                  To
                  <input
                    name={`windows.${index}.end`}
                    type="time"
                    required
                    value={window.end}
                    onChange={(event) => updateWindow(index, { end: event.target.value })}
                    className="mt-1 h-11 w-full border border-[var(--ink)]/20 bg-[var(--ticket)] px-3"
                  />
                </label>
                <label className="text-sm text-[var(--ink)]/60">
                  Session (min)
                  <input
                    name={`windows.${index}.sessionMinutes`}
                    type="number"
                    min={15}
                    max={240}
                    step={15}
                    required
                    value={window.sessionMinutes}
                    onChange={(event) =>
                      updateWindow(index, { sessionMinutes: Number(event.target.value) })
                    }
                    className="mt-1 h-11 w-full border border-[var(--ink)]/20 bg-[var(--ticket)] px-3"
                  />
                </label>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-[var(--ink)]/60">
                  Usual price (€)
                  <input
                    name={`windows.${index}.originalPrice`}
                    type="number"
                    min={1}
                    step="0.01"
                    required
                    value={window.originalPrice}
                    onChange={(event) => updateWindow(index, { originalPrice: event.target.value })}
                    className="mt-1 h-11 w-full border border-[var(--ink)]/20 bg-[var(--ticket)] px-3"
                  />
                </label>
                <label className="text-sm text-[var(--ink)]/60">
                  Fillslot price (€)
                  <input
                    name={`windows.${index}.dealPrice`}
                    type="number"
                    min={1}
                    step="0.01"
                    required
                    value={window.dealPrice}
                    onChange={(event) => updateWindow(index, { dealPrice: event.target.value })}
                    className="mt-1 h-11 w-full border border-[var(--ink)]/20 bg-[var(--ticket)] px-3"
                  />
                </label>
              </div>
              <p className="mt-5 font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--ink)]/45">
                Fill rule
              </p>
              <div className="mt-2 grid gap-2">
                <Chip
                  pressed={window.fillMode === "threshold"}
                  onClick={() => updateWindow(index, { fillMode: "threshold" })}
                >
                  <span className="block font-medium">At least this many people</span>
                  <span className="mt-1 block text-[13px] text-[var(--ink)]/60">
                    Session runs if the minimum is hit, up to a maximum.
                  </span>
                </Chip>
                <Chip
                  pressed={window.fillMode === "exact"}
                  onClick={() =>
                    updateWindow(index, {
                      fillMode: "exact",
                      minPartySize: window.capacity,
                    })
                  }
                >
                  <span className="block font-medium">Exactly this many people</span>
                  <span className="mt-1 block text-[13px] text-[var(--ink)]/60">
                    Static leftover — padel of 4, an escape room, that kind of session.
                  </span>
                </Chip>
                <Chip
                  pressed={window.fillMode === "cap"}
                  onClick={() => updateWindow(index, { fillMode: "cap", minPartySize: 1 })}
                >
                  <span className="block font-medium">Up to this many leftover spots</span>
                  <span className="mt-1 block text-[13px] text-[var(--ink)]/60">
                    Cinema seats, stadium tickets, or a single chair. No minimum to run.
                  </span>
                </Chip>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {window.fillMode === "threshold" ? (
                  <label className="text-sm text-[var(--ink)]/60">
                    Minimum people
                    <input
                      name={`windows.${index}.minPartySize`}
                      type="number"
                      min={1}
                      max={window.capacity}
                      required
                      value={window.minPartySize}
                      onChange={(event) =>
                        updateWindow(index, { minPartySize: Number(event.target.value) })
                      }
                      className="mt-1 h-11 w-full border border-[var(--ink)]/20 bg-[var(--ticket)] px-3"
                    />
                  </label>
                ) : (
                  <input type="hidden" name={`windows.${index}.minPartySize`} value={window.minPartySize} />
                )}
                <label className="text-sm text-[var(--ink)]/60">
                  {window.fillMode === "exact" ? "People needed" : "Maximum people"}
                  <input
                    name={`windows.${index}.capacity`}
                    type="number"
                    min={1}
                    max={80}
                    required
                    value={window.capacity}
                    onChange={(event) => {
                      const capacity = Number(event.target.value);
                      updateWindow(index, {
                        capacity,
                        minPartySize:
                          window.fillMode === "exact"
                            ? capacity
                            : Math.min(window.minPartySize, capacity),
                      });
                    }}
                    className="mt-1 h-11 w-full border border-[var(--ink)]/20 bg-[var(--ticket)] px-3"
                  />
                </label>
              </div>
              <p className="mt-3 text-sm text-[var(--ink)]/65">{fillHint(window)}</p>
              <p className="mt-1 text-sm text-[var(--ink)]/50">
                If it is still short about an hour before start, we invite more people and tell anyone
                already in about another leftover. Close to start, they get their money back.
              </p>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-4 text-sm font-medium text-[var(--turf)] underline"
          onClick={() => setWindows((current) => [...current, defaultWindow(category)])}
        >
          Add another leftover window
        </button>
      </section>

      {state?.error ? (
        <p className="bg-[#c7342b] px-3 py-2 text-sm text-white">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full bg-[var(--ink)] font-display text-lg text-[var(--ball)] disabled:opacity-50"
      >
        {pending ? "Saving leftover week…" : "Publish leftover week"}
      </button>
    </form>
  );
}
