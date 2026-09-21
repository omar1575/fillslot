"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { BookingError, startCheckout } from "@/lib/booking";

export async function bookSlotAction(formData: FormData) {
  const slotId = String(formData.get("slotId") ?? "");
  const quantity = Math.floor(Number(formData.get("quantity") ?? 1));
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/deals/${slotId}`)}`);
  }
  if (!slotId) redirect("/deals");

  let checkoutUrl: string;
  try {
    const checkout = await startCheckout(slotId, session.user.id, quantity);
    checkoutUrl = checkout.url;
  } catch (error) {
    if (error instanceof BookingError) {
      redirect(`/deals/${slotId}?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }
  redirect(checkoutUrl);
}
