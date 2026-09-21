import { redirect } from "next/navigation";
import { requireVendor } from "@/lib/audience";

export const metadata = { title: "Venue desk" };

export default async function PartnerDeskPage() {
  await requireVendor("/club");
  redirect("/club");
}
