import { NextResponse } from "next/server";
import { processFillDeadlines } from "@/lib/fill";
import { materializeAllSchedules } from "@/lib/schedule";

export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const materialized = await materializeAllSchedules();
  const fill = await processFillDeadlines();
  return NextResponse.json({ ok: true, materialized, fill });
}

export async function POST(request: Request) {
  return GET(request);
}
