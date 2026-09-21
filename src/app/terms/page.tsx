export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-5xl">Terms</h1>
      <div className="mt-6 space-y-4 text-[var(--ink)]/80">
        <p>
          Fillslot sells leftover bookable time. A booking is one court for the printed window.
          Payment is taken in advance.
        </p>
        <p>
          Bookings are non-refundable unless the club cancels. If the club cancels, Fillslot
          refunds the amount you paid.
        </p>
        <p>
          Fillslot is a marketplace. The club provides the court. Fillslot takes a commission on
          each paid booking.
        </p>
        <p>These terms are a placeholder for a Netherlands-based pilot and are not legal advice.</p>
      </div>
    </main>
  );
}
