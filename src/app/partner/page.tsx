import { redirect } from "next/navigation";
import { requireVendor } from "@/lib/audience";

export const metadata = { title: "Partner" };

export default async function PartnerPage() {
  await requireVendor("/club");
  redirect("/club");
}
