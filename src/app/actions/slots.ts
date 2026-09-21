"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb } from "@/db";
import { courts, slots, venues } from "@/db/schema";
import {
  BookingError,
  cancelOpenSlot,
  refundAndCancelBooking,
} from "@/lib/booking";
import { amsterdamInputToUtc } from "@/lib/time";

async function requireClubVenue() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/club");
  if (session.user.role !== "club" && session.user.role !== "admin") {
    redirect("/");
  }
  const db = await getDb();
  const venue = await db.query.venues.findFirst({
    where: eq(venues.ownerId, session.user.id),
  });
  if (!venue) {
    throw new BookingError("No club is attached to this account yet.");
  }
  return { session, venue };
}

export async function createSlotAction(formData: FormData) {
  const { venue } = await requireClubVenue();
  const courtId = String(formData.get("courtId") ?? "");
  const startsLocal = String(formData.get("startsAt") ?? "");
  const endsLocal = String(formData.get("endsAt") ?? "");
  const originalPrice = Number(formData.get("originalPrice"));
  const dealPrice = Number(formData.get("dealPrice"));

  if (!courtId || !startsLocal || !endsLocal) {
    redirect("/club/slots/new?error=Fill%20in%20every%20field");
  }

  const originalPriceCents = Math.round(originalPrice * 100);
  const dealPriceCents = Math.round(dealPrice * 100);
  if (
    !Number.isFinite(originalPriceCents) ||
    !Number.isFinite(dealPriceCents) ||
    dealPriceCents <= 0 ||
    originalPriceCents < dealPriceCents
  ) {
    redirect("/club/slots/new?error=Deal%20price%20must%20be%20lower%20than%20the%20usual%20rate");
  }

  const startsAt = amsterdamInputToUtc(startsLocal);
  const endsAt = amsterdamInputToUtc(endsLocal);
  if (endsAt <= startsAt || startsAt <= new Date()) {
    redirect("/club/slots/new?error=Pick%20a%20future%20time%20window");
  }

  const db = await getDb();
  const court = await db.query.courts.findFirst({
    where: eq(courts.id, courtId),
  });
  if (!court || court.venueId !== venue.id) {
    redirect("/club/slots/new?error=Unknown%20court");
  }

  try {
    await db.insert(slots).values({
      courtId,
      startsAt,
      endsAt,
      originalPriceCents,
      dealPriceCents,
      status: "open",
    });
  } catch {
    redirect("/club/slots/new?error=That%20court%20already%20has%20a%20slot%20at%20this%20time");
  }

  revalidatePath("/club");
  revalidatePath("/deals");
  redirect("/club");
}

export async function cancelSlotAction(formData: FormData) {
  const { session } = await requireClubVenue();
  const slotId = String(formData.get("slotId") ?? "");
  await cancelOpenSlot(slotId, session.user.id);
  revalidatePath("/club");
  revalidatePath("/deals");
}

export async function refundBookingAction(formData: FormData) {
  const { session } = await requireClubVenue();
  const bookingId = String(formData.get("bookingId") ?? "");
  await refundAndCancelBooking(bookingId, session.user.id);
  revalidatePath("/club");
  revalidatePath("/bookings");
}
