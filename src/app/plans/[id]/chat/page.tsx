import { redirect } from "next/navigation";

export const metadata = { title: "Group chat" };

export default async function PlanChatRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/chat/${id}`);
}
