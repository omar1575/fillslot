import { PlanExperience } from "@/components/group/plan-experience";

export const metadata = { title: "Plan" };

export default async function PlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const invited = query.invite === "1" || query.join === "1";
  return <PlanExperience planId={id} invited={invited} />;
}
