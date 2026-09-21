"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb } from "@/db";
import { venues } from "@/db/schema";

export async function approveVenueAction(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/");
  }
  const venueId = String(formData.get("venueId") ?? "");
  const db = await getDb();
  await db
    .update(venues)
    .set({ status: "approved" })
    .where(eq(venues.id, venueId));
  revalidatePath("/admin/venues");
  revalidatePath("/deals");
}
