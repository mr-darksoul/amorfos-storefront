import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: { action?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action } = body;
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be approve or reject" }, { status: 422 });
  }

  if (action === "reject") {
    const { error } = await supabase().from("reviews").delete().eq("id", id);
    if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });
  } else {
    const { error } = await supabase().from("reviews").update({ status: "approved" }).eq("id", id);
    if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
