"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { completeOnboardingAction } from "@/app/actions/onboarding";
import {
  ONBOARDING_INTERESTS,
  ONBOARDING_REASONS,
  type OnboardingInterest,
  type OnboardingReason,
} from "@/lib/onboarding-options";

const DRAFT_KEY = "fillslot-onboarding-draft";

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

export function OnboardingForm({
  firstName,
  minDate,
  maxDate,
}: {
  firstName?: string | null;
  minDate: string;
  maxDate: string;
}) {
  const pathname = usePathname();
  const [state, action, pending] = useActionState(completeOnboardingAction, null);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [interests, setInterests] = useState<OnboardingInterest[]>([]);
  const [reasons, setReasons] = useState<OnboardingReason[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as {
          dateOfBirth?: string;
          interests?: OnboardingInterest[];
          reasons?: OnboardingReason[];
        };
        if (draft.dateOfBirth) setDateOfBirth(draft.dateOfBirth);
        if (draft.interests) setInterests(draft.interests);
        if (draft.reasons) setReasons(draft.reasons);
      }
    } catch {
      sessionStorage.removeItem(DRAFT_KEY);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ dateOfBirth, interests, reasons }),
    );
  }, [hydrated, dateOfBirth, interests, reasons]);

  const next =
    !pathname || pathname === "/onboarding" || pathname.startsWith("/login")
      ? "/"
      : pathname;

  function toggleInterest(id: OnboardingInterest) {
    setInterests((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function toggleReason(id: OnboardingReason) {
    setReasons((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  return (
    <form
      action={action}
      onSubmit={() => sessionStorage.removeItem(DRAFT_KEY)}
      className="mt-8 space-y-10"
    >
      <input type="hidden" name="next" value={next} />
      {interests.map((id) => (
        <input key={id} type="hidden" name="interests" value={id} />
      ))}
      {reasons.map((id) => (
        <input key={id} type="hidden" name="reasons" value={id} />
      ))}

      <section>
        <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--ink)]/45">
          01 · Birthday
        </p>
        <h2 className="mt-2 font-display text-2xl">
          {firstName ? `${firstName}, when were you born?` : "When were you born?"}
        </h2>
        <label htmlFor="dateOfBirth" className="sr-only">
          Date of birth
        </label>
        <input
          id="dateOfBirth"
          name="dateOfBirth"
          type="date"
          required
          min={minDate}
          max={maxDate}
          value={dateOfBirth}
          onChange={(event) => setDateOfBirth(event.target.value)}
          suppressHydrationWarning
          className="mt-4 h-12 w-full border border-[var(--ink)]/20 bg-[var(--ticket)] px-3 text-base outline-none focus-visible:border-[var(--ink)]"
        />
      </section>

      <section>
        <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--ink)]/45">
          02 · Interests
        </p>
        <h2 className="mt-2 font-display text-2xl">What are you into?</h2>
        <p className="mt-1 text-sm text-[var(--ink)]/60">Pick as many as you want.</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ONBOARDING_INTERESTS.map((interest) => (
            <Chip
              key={interest.id}
              pressed={interests.includes(interest.id)}
              onClick={() => toggleInterest(interest.id)}
            >
              {interest.label}
            </Chip>
          ))}
        </div>
      </section>

      <section>
        <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--ink)]/45">
          03 · Why Fillslot
        </p>
        <h2 className="mt-2 font-display text-2xl">Why are you here?</h2>
        <p className="mt-1 text-sm text-[var(--ink)]/60">One or both is fine.</p>
        <div className="mt-4 grid gap-2">
          {ONBOARDING_REASONS.map((reason) => (
            <Chip
              key={reason.id}
              pressed={reasons.includes(reason.id)}
              onClick={() => toggleReason(reason.id)}
            >
              <span className="block font-medium">{reason.label}</span>
              <span className="mt-1 block text-[13px] text-[var(--ink)]/60">{reason.hint}</span>
            </Chip>
          ))}
        </div>
      </section>

      {state?.error ? (
        <p className="bg-[#c7342b] px-3 py-2 text-sm text-white">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full bg-[var(--ink)] font-display text-lg text-[var(--ball)] disabled:opacity-50"
      >
        {pending ? "Saving…" : "See leftover deals"}
      </button>
    </form>
  );
}
