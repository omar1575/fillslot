import Link from "next/link";
import { ChatEmpty } from "@/components/group/chat-empty";
import { HeldPlanChats } from "@/components/group/held-plan-chats";
import { listUserChatRooms } from "@/lib/chat";
import { formatTime } from "@/lib/time";
import { requirePlayer } from "@/lib/audience";

export const dynamic = "force-dynamic";

export const metadata = { title: "Group chat" };

export default async function ChatIndexPage() {
  const session = await requirePlayer("/chat");

  const rooms = await listUserChatRooms(session.user.id);

  return (
    <main className="page">
      <p className="kicker text-[var(--ink)]/50">Same activity · same time</p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">Group chats</h1>
      <p className="mt-3 max-w-xl text-[var(--ink)]/70">
        Talk with the other people signed up for your window. Each chat is one activity and one
        timeslot.
      </p>
      <div className="mt-8 grid gap-4 sm:mt-10">
        <HeldPlanChats />
        {rooms.map((room) => (
          <Link
            key={room.roomId}
            href={`/chat/${room.roomId}`}
            className="ticket flex flex-wrap items-center justify-between gap-4 bg-[var(--ticket)] px-5 py-4 shadow-ticket"
          >
            <div>
              <p className="kicker text-[var(--ink)]/45">Booked window</p>
              <p className="font-display text-xl">{room.title}</p>
              <p className="text-sm text-[var(--ink)]/65">{room.subtitle}</p>
              {room.lastBody ? (
                <p className="mt-2 line-clamp-1 text-sm text-[var(--ink)]/55">{room.lastBody}</p>
              ) : (
                <p className="mt-2 text-sm text-[var(--ink)]/45">No messages yet</p>
              )}
            </div>
            <p className="text-sm text-[var(--ink)]/50">
              {room.lastAt ? formatTime(new Date(room.lastAt)) : "Open"}
            </p>
          </Link>
        ))}
        <ChatEmpty hasBookingRooms={rooms.length > 0} />
      </div>
    </main>
  );
}
