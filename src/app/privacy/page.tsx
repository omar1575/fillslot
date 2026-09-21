export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <main className="page max-w-2xl">
      <p className="kicker text-[var(--ink)]/50">Legal</p>
      <h1 className="mt-2 font-display text-5xl">Privacy</h1>
      <div className="ticket mt-6 space-y-4 bg-[var(--ticket)] p-6 text-[var(--ink)]/80 shadow-ticket">
        <p>
          Fillslot stores the email and name you use to sign in, the bookings you make, and the
          venue listings you publish. Payment details are handled by Stripe.
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
