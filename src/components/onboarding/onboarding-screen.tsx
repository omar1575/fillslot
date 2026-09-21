import { auth } from "@/auth";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { isoDateOffsetYears, ONBOARDING_MIN_AGE } from "@/lib/onboarding-options";

export async function OnboardingScreen() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? null;

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-16 sm:px-6">
      <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--ink)]/50">
        First session
      </p>
      <h1 className="mt-2 font-display text-5xl leading-[0.92]">Quick intro</h1>
      <p className="mt-3 text-[var(--ink)]/70">
        Three short questions so leftover hours in Maastricht fit you. You only see this once.
      </p>
      <OnboardingForm
        firstName={firstName}
        minDate={isoDateOffsetYears(-120)}
        maxDate={isoDateOffsetYears(-ONBOARDING_MIN_AGE)}
      />
    </main>
  );
}
