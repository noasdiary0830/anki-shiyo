import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPDF } from "@/lib/pdf";
import { generateCards, addWebSearchSupplement } from "@/lib/claude";
import { GeneratedCard } from "@/types";
import crypto from "crypto";

export const maxDuration = 300;

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

    // Extract text
    const text = await extractTextFromPDF(buffer);

    if (!text || text.trim().length < 100) {
      return NextResponse.json(
        { error: "PDFからテキストを抽出できませんでした" },
        { status: 400 }
      );
    }

    // Generate cards
    const rawCards = await generateCards(text, unitName || "医学", targetCount);

    // Add web search supplements (process in batches to avoid rate limits)
    const cards: GeneratedCard[] = [];
    const batchSize = 5;

    for (let i = 0; i < rawCards.length; i += batchSize) {
      const batch = rawCards.slice(i, i + batchSize);
      const supplemented = await Promise.all(
        batch.map(async (card) => {
          const supplement = await addWebSearchSupplement(card.front, card.back);
          return {
            id: crypto.randomUUID(),
            type: "text" as const,
            front: card.front,
            back: card.back + supplement,
            selected: true,
          };
        })
      );
      cards.push(...supplemented);
    }

    return NextResponse.json({ cards });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "問題生成中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
