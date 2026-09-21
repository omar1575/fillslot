import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import {
  bookings,
  courts,
  groupMessages,
  slots,
  users,
  venues,
} from "@/db/schema";
import { seedActivities } from "@/lib/group-plan";
import { formatDate, formatTimeRange } from "@/lib/time";

export const ROOM_ID_RE = /^[a-zA-Z0-9_-]{3,80}$/;
export const MAX_MESSAGE_LENGTH = 500;

export type ChatMessageView = {
  id: string;
  roomId: string;
  userId: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type ChatMember = {
  id: string;
  name: string;
};

export type ChatRoomMeta = {
  kind: "slot" | "plan";
  roomId: string;
  title: string;
  subtitle: string;
  members: ChatMember[];
};

export type ChatRoomListItem = {
  roomId: string;
  title: string;
  subtitle: string;
  lastBody: string | null;
  lastAt: string | null;
};

export class ChatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatError";
  }
}

export function isValidRoomId(roomId: string) {
  return ROOM_ID_RE.test(roomId);
}

export function displayName(user: { name: string | null; email: string | null }) {
  const name = user.name?.trim();
  if (name) return name;
  if (user.email) return user.email.split("@")[0] ?? "Player";
  return "Player";
}

function uniqueMembers(people: ChatMember[]) {
  return [...new Map(people.map((person) => [person.id, person])).values()];
}

export async function canAccessRoom(userId: string, role: string, roomId: string) {
  if (!isValidRoomId(roomId)) return false;
  const db = await getDb();
  const [slotRow] = await db
    .select({
      slot: slots,
      venue: venues,
    })
    .from(slots)
    .innerJoin(courts, eq(slots.courtId, courts.id))
    .innerJoin(venues, eq(courts.venueId, venues.id))
    .where(eq(slots.id, roomId))
    .limit(1);

  if (!slotRow) {
    return roomId.startsWith("plan_") || roomId.startsWith("act_");
  }
  if (role === "admin") return true;
  if (slotRow.venue.ownerId === userId) return true;

  const [booking] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.slotId, roomId),
        eq(bookings.userId, userId),
        inArray(bookings.status, ["paid", "completed"]),
      ),
    )
    .limit(1);
  return Boolean(booking);
}

export async function listGroupMessages(roomId: string): Promise<ChatMessageView[]> {
  const db = await getDb();
  const rows = await db
    .select({
      message: groupMessages,
      author: users,
    })
    .from(groupMessages)
    .innerJoin(users, eq(groupMessages.userId, users.id))
    .where(eq(groupMessages.roomId, roomId))
    .orderBy(asc(groupMessages.createdAt))
    .limit(200);

  return rows.map((row) => ({
    id: row.message.id,
    roomId: row.message.roomId,
    userId: row.message.userId,
    authorName: displayName(row.author),
    body: row.message.body,
    createdAt: row.message.createdAt.toISOString(),
  }));
}

export async function postGroupMessage(roomId: string, userId: string, rawBody: string) {
  const body = rawBody.trim();
  if (!body) throw new ChatError("Write something before sending.");
  if (body.length > MAX_MESSAGE_LENGTH) {
    throw new ChatError("Keep it under 500 characters.");
  }

  const db = await getDb();
  await db.insert(groupMessages).values({ roomId, userId, body });
  return listGroupMessages(roomId);
}

export async function getRoomMeta(roomId: string): Promise<ChatRoomMeta> {
  const db = await getDb();
  const [slotRow] = await db
    .select({
      slot: slots,
      court: courts,
      venue: venues,
    })
    .from(slots)
    .innerJoin(courts, eq(slots.courtId, courts.id))
    .innerJoin(venues, eq(courts.venueId, venues.id))
    .where(eq(slots.id, roomId))
    .limit(1);

  if (slotRow) {
    const people = await db
      .select({ user: users })
      .from(bookings)
      .innerJoin(users, eq(bookings.userId, users.id))
      .where(
        and(eq(bookings.slotId, roomId), inArray(bookings.status, ["paid", "completed"])),
      );
    return {
      kind: "slot",
      roomId,
      title: slotRow.venue.name,
      subtitle: `${slotRow.court.name} · ${formatDate(slotRow.slot.startsAt)} · ${formatTimeRange(slotRow.slot.startsAt, slotRow.slot.endsAt)}`,
      members: uniqueMembers(
        people.map((row) => ({ id: row.user.id, name: displayName(row.user) })),
      ),
    };
  }

  const plan = seedActivities().find((activity) => activity.id === roomId);
  const posters = await db
    .select({ user: users })
    .from(groupMessages)
    .innerJoin(users, eq(groupMessages.userId, users.id))
    .where(eq(groupMessages.roomId, roomId));

  return {
    kind: "plan",
    roomId,
    title: plan?.venueName ?? "Group chat",
    subtitle: plan
      ? `${plan.title} · ${formatDate(new Date(plan.startsAt))} · ${formatTimeRange(new Date(plan.startsAt), new Date(plan.endsAt))}`
      : "Same activity, same time window",
    members: uniqueMembers(
      posters.map((row) => ({ id: row.user.id, name: displayName(row.user) })),
    ),
  };
}

export async function listUserChatRooms(userId: string): Promise<ChatRoomListItem[]> {
  const db = await getDb();
  const bookingRows = await db
    .select({
      slot: slots,
      court: courts,
      venue: venues,
    })
    .from(bookings)
    .innerJoin(slots, eq(bookings.slotId, slots.id))
    .innerJoin(courts, eq(slots.courtId, courts.id))
    .innerJoin(venues, eq(courts.venueId, venues.id))
    .where(and(eq(bookings.userId, userId), inArray(bookings.status, ["paid", "completed"])))
    .orderBy(asc(slots.startsAt));

  const rooms = new Map<string, ChatRoomListItem>();
  for (const row of bookingRows) {
    rooms.set(row.slot.id, {
      roomId: row.slot.id,
      title: row.venue.name,
      subtitle: `${row.court.name} · ${formatDate(row.slot.startsAt)} · ${formatTimeRange(row.slot.startsAt, row.slot.endsAt)}`,
      lastBody: null,
      lastAt: null,
    });
  }

  const roomIds = [...rooms.keys()];
  if (roomIds.length > 0) {
    const latest = await db
      .select()
      .from(groupMessages)
      .where(inArray(groupMessages.roomId, roomIds))
      .orderBy(desc(groupMessages.createdAt));
    const seen = new Set<string>();
    for (const message of latest) {
      if (seen.has(message.roomId)) continue;
      seen.add(message.roomId);
      const room = rooms.get(message.roomId);
      if (!room) continue;
      room.lastBody = message.body;
      room.lastAt = message.createdAt.toISOString();
    }
  }

  return [...rooms.values()].sort((a, b) => {
    const aTime = a.lastAt ? Date.parse(a.lastAt) : 0;
    const bTime = b.lastAt ? Date.parse(b.lastAt) : 0;
    return bTime - aTime;
  });
}
