import { addMinutes } from "date-fns";
import type { Booking } from "@/db/schema";
import { CHECKOUT_HOLD_MINUTES } from "@/lib/constants";

type HoldBooking = Pick<Booking, "status" | "quantity" | "createdAt">;

export function isPendingHoldActive(booking: HoldBooking, now = new Date()) {
  if (booking.status !== "pending") return false;
  return addMinutes(booking.createdAt, CHECKOUT_HOLD_MINUTES) > now;
}

export function reservedQuantity(bookings: HoldBooking[], now = new Date()) {
  return bookings.reduce((sum, booking) => {
    if (booking.status === "paid") return sum + booking.quantity;
    if (isPendingHoldActive(booking, now)) return sum + booking.quantity;
    return sum;
  }, 0);
}

export function remainingCapacity(
  capacity: number,
  bookings: HoldBooking[],
  now = new Date(),
) {
  return Math.max(0, capacity - reservedQuantity(bookings, now));
}
