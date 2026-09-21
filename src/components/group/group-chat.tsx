"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { listGroupMessagesAction, sendGroupMessageAction } from "@/app/actions/chat";
import type { ChatMessageView } from "@/lib/chat";
import { formatTime } from "@/lib/time";
import { cn } from "@/lib/utils";

export function GroupChat({
  roomId,
  currentUserId,
  initialMessages,
  title,
  subtitle,
  members,
  backHref,
  backLabel,
}: {
  roomId: string;
  currentUserId: string;
  initialMessages: ChatMessageView[];
  title: string;
  subtitle: string;
  members: string[];
  backHref: string;
  backLabel: string;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void listGroupMessagesAction(roomId).then((next) => {
        setMessages(next);
      });
    }, 3000);
    return () => window.clearInterval(timer);
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const names = [
    ...new Set([
      ...members.filter((name) => name !== "You"),
      ...messages.map((message) => (message.userId === currentUserId ? "You" : message.authorName)),
    ]),
  ];
  const memberLine = names.length > 0 ? names.join(" · ") : "Nobody else has written yet";

  return (
    <main className="page flex max-w-xl flex-col pb-28 sm:pb-16">
      <Link href={backHref} className="font-mono text-xs tracking-[0.16em] uppercase text-[var(--ink)]/50">
        ← {backLabel}
      </Link>
      <p className="kicker mt-4 text-[var(--ink)]/50">Group chat</p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">{title}</h1>
      <p className="mt-2 text-[var(--ink)]/70">{subtitle}</p>
      <p className="mt-2 font-mono text-[11px] tracking-[0.16em] text-[var(--ink)]/50 uppercase">
        {memberLine}
      </p>

      <div className="mt-6 flex min-h-[52vh] flex-col bg-[var(--ticket)] shadow-ticket">
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-5">
          {messages.length === 0 ? (
            <div className="py-10 text-center">
              <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--ink)]/45">
                Same window
              </p>
              <p className="mt-2 font-display text-2xl">Nobody has written yet</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--ink)]/65">
                This thread is only for people signed up for this activity and time. Say when you
                are arriving.
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const mine = message.userId === currentUserId;
              return (
                <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] px-3 py-2 text-sm",
                      mine
                        ? "bg-[var(--turf)] text-[var(--cream)]"
                        : "bg-[var(--glass)] text-[var(--ink)]",
                    )}
                  >
                    <p
                      className={cn(
                        "font-mono text-[10px] tracking-[0.16em] uppercase",
                        mine ? "text-[var(--cream)]/70" : "text-[var(--ink)]/50",
                      )}
                    >
                      {mine ? "You" : message.authorName} · {formatTime(new Date(message.createdAt))}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form
          className="sticky bottom-0 border-t border-[var(--ink)]/10 bg-[var(--ticket)] p-3 sm:p-4"
          onSubmit={(event) => {
            event.preventDefault();
            const text = body.trim();
            if (!text || pending) return;
            const formData = new FormData();
            formData.set("roomId", roomId);
            formData.set("body", text);
            startTransition(async () => {
              const result = await sendGroupMessageAction(formData);
              if (result.error) {
                setError(result.error);
                return;
              }
              setError(null);
              setBody("");
              if (result.messages) setMessages(result.messages);
            });
          }}
        >
          {error ? <p className="notice-error mb-3">{error}</p> : null}
          <label htmlFor="chat-body" className="sr-only">
            Message
          </label>
          <div className="flex gap-2">
            <textarea
              id="chat-body"
              name="body"
              rows={1}
              value={body}
              maxLength={500}
              placeholder="Message the group…"
              className="field h-11 min-h-11 flex-1 resize-none py-2.5"
              onChange={(event) => setBody(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <button type="submit" className="btn-ball h-11 shrink-0 px-4" disabled={pending}>
              {pending ? "Sending" : "Send"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
