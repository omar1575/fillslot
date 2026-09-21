import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MerchantOnboardingForm } from "@/components/merchant/merchant-onboarding-form";
import { windowsToDraft } from "@/lib/merchant-onboarding";
import { getVenueForOwner, getWeeklyWindowsForVenue } from "@/lib/queries";

export const metadata = { title: "List leftover hours" };

export default async function ClubOnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/club/onboarding");
  }
  if (session.user.role === "admin") {
    redirect("/admin/venues");
  }

  const venue = await getVenueForOwner(session.user.id);
  const windows = venue ? await getWeeklyWindowsForVenue(venue.id) : [];

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-16 sm:px-6">
      <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--ink)]/50">
        Partner
      </p>
      <h1 className="mt-2 font-display text-5xl leading-[0.92]">Dump leftover hours</h1>
      <p className="mt-3 text-[var(--ink)]/70">
        Tell us what you run, pick a category, then set the leftover windows for the week. Guests
        pay the deal price. If a session needs people and still is not filled about an hour before
        start, we invite others or refund.
      </p>
      <MerchantOnboardingForm
        initialName={venue?.name ?? session.user.name ?? ""}
        initialSummary={venue?.description ?? ""}
        initialAddress={venue?.address ?? ""}
        initialPostalCode={venue?.postalCode ?? ""}
        initialCity={venue?.city}
        initialCategory={venue?.category}
        initialWindows={windowsToDraft(windows)}
      />
    </main>
  );
}
