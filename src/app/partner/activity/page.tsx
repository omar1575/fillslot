import Link from "next/link";
import { ActivityForm } from "@/components/group/activity-form";

export const metadata = { title: "New activity" };

export default function NewActivityPage() {
  return (
    <main className="page max-w-lg">
      <p className="kicker text-[var(--ink)]/50">Venue listing</p>
      <h1 className="mt-2 font-display text-5xl">Add an activity</h1>
      <p className="mt-3 text-[var(--ink)]/70">
        Usual price and a discount. Min capacity plus full capacity. Location. Optional even-number
        and flexible rules.
      </p>
      <p className="mt-3 text-sm">
        <Link href="/partner/desk" className="underline">
          Back to desk
        </Link>
      </p>
      <div className="mt-8">
        <ActivityForm />
      </div>
    </main>
  );
}
