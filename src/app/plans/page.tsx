import { PlansBoard } from "@/components/group/plans-board";
import { requirePlayer } from "@/lib/audience";

export const metadata = { title: "Plan" };

export default async function PlansPage() {
  await requirePlayer("/plans");
  return <PlansBoard />;
}
