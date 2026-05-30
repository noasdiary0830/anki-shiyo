import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPDF } from "@/lib/pdf";
import { generateCards } from "@/lib/claude";
import { GeneratedCard } from "@/types";
import crypto from "crypto";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("pdf") as File | null;
    const unitName = formData.get("unitName") as string;
    const targetCountStr = formData.get("targetCount") as string;

    if (!file) {
      return NextResponse.json({ error: "PDFファイルが必要です" }, { status: 400 });
    }

    const targetCount = Math.min(parseInt(targetCountStr) || 100, 200);
    const buffer = Buffer.from(await file.arrayBuffer());

    const text = await extractTextFromPDF(buffer);

    if (!text || text.trim().length < 100) {
      return NextResponse.json(
        { error: "PDFからテキストを抽出できませんでした" },
        { status: 400 }
      );
    }

    const rawCards = await generateCards(text, unitName || "医学", targetCount);

    const cards: GeneratedCard[] = rawCards.map((card) => ({
      id: crypto.randomUUID(),
      type: "text" as const,
      front: card.front,
      back: card.back,
      selected: true,
    }));

    return NextResponse.json({ cards });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "問題生成中にエラーが発生しました",
      },
      { status: 500 }
    );
  }
}
