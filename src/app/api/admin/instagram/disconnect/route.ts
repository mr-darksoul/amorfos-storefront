import { NextResponse } from "next/server";
import { disconnect } from "@/lib/instagram";

export const runtime = "nodejs";

export async function POST() {
  try {
    await disconnect();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
