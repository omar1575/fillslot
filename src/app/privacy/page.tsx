export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-5xl">Privacy</h1>
      <div className="mt-6 space-y-4 text-[var(--ink)]/80">
        <p>
          Fillslot stores the email and name you use to sign in, the bookings you make, and the
          club listings you publish. Payment details are handled by Stripe.
        </p>
        <p>
          We process this data to run the marketplace: accounts, bookings, payouts, and fraud
          prevention. The pilot is aimed at users in the Netherlands (GDPR).
        </p>
        <p>
          You can ask to see or delete your account data by emailing the operator. This page is a
          placeholder until a formal privacy notice is published.
        </p>
      </div>
    </main>
  );
}
