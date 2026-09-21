import { redirect } from "next/navigation";
import Stripe from "stripe";
import { auth } from "@/auth";
import { fulfillCheckoutSession } from "@/lib/booking";
import { getBookingByCheckoutSession } from "@/lib/queries";
import { getStripe } from "@/lib/stripe";

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
  if (checkout.payment_status !== "paid") {
    redirect("/bookings");
  }
  const booking = await fulfillCheckoutSession(checkout as Stripe.Checkout.Session);
  if (!booking) redirect("/bookings");
  redirect(`/bookings/${booking.id}`);
}
