import { PlanExperience } from "@/components/group/plan-experience";
import { requirePlayer } from "@/lib/audience";

export const metadata = { title: "Plan" };

export default async function PlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  await requirePlayer(`/plans/${id}`);
  const query = await searchParams;
  const invited = query.invite === "1" || query.join === "1";
  return <PlanExperience planId={id} invited={invited} />;
}
