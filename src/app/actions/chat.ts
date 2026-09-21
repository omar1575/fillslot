"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  canAccessRoom,
  ChatError,
  isValidRoomId,
  listGroupMessages,
  postGroupMessage,
  type ChatMessageView,
} from "@/lib/chat";

export async function listGroupMessagesAction(roomId: string): Promise<ChatMessageView[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  if (!isValidRoomId(roomId)) return [];
  if (!(await canAccessRoom(session.user.id, session.user.role, roomId))) return [];
  return listGroupMessages(roomId);
}

export async function sendGroupMessageAction(formData: FormData): Promise<{
  error?: string;
  messages?: ChatMessageView[];
}> {
  const session = await auth();
  const roomId = String(formData.get("roomId") ?? "");
  const body = String(formData.get("body") ?? "");
  if (!session?.user?.id) {
    return { error: "Sign in to send a message." };
  }
  if (!isValidRoomId(roomId)) {
    return { error: "That group chat is gone." };
  }
  if (!(await canAccessRoom(session.user.id, session.user.role, roomId))) {
    return { error: "You are not in this group." };
  }

  try {
    const messages = await postGroupMessage(roomId, session.user.id, body);
    revalidatePath(`/chat/${roomId}`);
    revalidatePath("/chat");
    revalidatePath(`/plans/${roomId}/chat`);
    return { messages };
  } catch (error) {
    if (error instanceof ChatError) return { error: error.message };
    throw error;
  }
}
