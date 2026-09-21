export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <main className="page max-w-2xl">
      <p className="kicker text-[var(--ink)]/50">Legal</p>
      <h1 className="mt-2 font-display text-5xl">Terms</h1>
      <div className="ticket mt-6 space-y-4 bg-[var(--ticket)] p-6 text-[var(--ink)]/80 shadow-ticket">
        <p>
          Fillslot sells leftover bookable time and leftover tickets. A booking is one resource for
          the printed window, or a quantity of leftover cinema or stadium tickets. Payment is taken
          in advance.
        </p>
        <p>
          Bookings are non-refundable unless the venue cancels. If the venue cancels, Fillslot
          refunds the amount you paid.
        </p>
        <p>
          Fillslot is a marketplace. The venue provides the slot. Fillslot takes a commission on
          each paid booking.
        </p>
        <p>These terms are a placeholder for a Netherlands-based pilot and are not legal advice.</p>
      </div>
    </main>
  );
}
