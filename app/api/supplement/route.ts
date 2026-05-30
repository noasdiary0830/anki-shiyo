import { NextRequest, NextResponse } from "next/server";
import { addWebSearchSupplement } from "@/lib/claude";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { front, back } = await req.json();

    if (!front || !back) {
      return NextResponse.json({ error: "front と back が必要です" }, { status: 400 });
    }

    const supplement = await addWebSearchSupplement(front, back);
    return NextResponse.json({ supplement });
  } catch (error) {
    console.error("Supplement error:", error);
    return NextResponse.json({ supplement: "" });
  }
}
