import { notFound, redirect } from "next/navigation";
import { GroupChat } from "@/components/group/group-chat";
import { PlanChatRoom } from "@/components/group/plan-chat-room";
import { canAccessRoom, getRoomMeta, isValidRoomId, listGroupMessages } from "@/lib/chat";
import { requirePlayer } from "@/lib/audience";

export const dynamic = "force-dynamic";

export const metadata = { title: "Group chat" };

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  if (!isValidRoomId(roomId)) notFound();
  const session = await requirePlayer(`/chat/${roomId}`);
  if (!(await canAccessRoom(session.user.id, session.user.role, roomId))) {
    redirect("/chat");
  }

  const [meta, messages] = await Promise.all([getRoomMeta(roomId), listGroupMessages(roomId)]);
  const memberNames = meta.members.map((member) =>
    member.id === session.user.id ? "You" : member.name,
  );

  if (meta.kind === "plan") {
    return (
      <PlanChatRoom
        planId={roomId}
        currentUserId={session.user.id}
        initialMessages={messages}
        fallbackTitle={meta.title}
        fallbackSubtitle={meta.subtitle}
        fallbackMembers={memberNames}
      />
    );
  }

  return (
    <GroupChat
      roomId={roomId}
      currentUserId={session.user.id}
      initialMessages={messages}
      title={meta.title}
      subtitle={meta.subtitle}
      members={memberNames}
      backHref="/bookings"
      backLabel="Bookings"
    />
  );
}
