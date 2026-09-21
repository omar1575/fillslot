import { redirect } from "next/navigation";
import Stripe from "stripe";
import { auth } from "@/auth";
import { AutoRefresh } from "@/components/auto-refresh";
import { fulfillCheckoutSession } from "@/lib/booking";
import { getBookingByCheckoutSession } from "@/lib/queries";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export const metadata = { title: "Payment" };

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/bookings");
  const query = await searchParams;
  const sessionId = typeof query.session_id === "string" ? query.session_id : "";
  if (!sessionId) redirect("/bookings");

  const existing = await getBookingByCheckoutSession(sessionId);
  if (existing) redirect(`/bookings/${existing.id}`);

  const stripe = getStripe();
  if (!stripe) redirect("/bookings");
  const checkout = await stripe.checkout.sessions.retrieve(sessionId);

  if (checkout.payment_status === "paid") {
    const booking = await fulfillCheckoutSession(checkout as Stripe.Checkout.Session);
    if (!booking) redirect("/bookings");
    redirect(`/bookings/${booking.id}`);
  }

  return (
    <main className="page max-w-lg text-center">
      <AutoRefresh seconds={4} />
      <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--ink)]/50">
        iDEAL / card
      </p>
      <div className="ticket mt-6 bg-[var(--ticket)] px-6 py-12 shadow-ticket">
        <p className="font-mono text-[11px] tracking-[0.22em] text-[var(--turf)] uppercase">
          Payment received
        </p>
        <h1 className="mt-4 font-display text-4xl">Confirming your leftover…</h1>
        <p className="mx-auto mt-4 max-w-sm text-[var(--ink)]/70">
          Banks can take a few seconds. Keep this tab open — your check-in code appears as soon as
          the payment settles.
        </p>
      </div>
    </main>
  );
}
