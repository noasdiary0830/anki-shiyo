import { NextRequest, NextResponse } from "next/server";
import { generateCards } from "@/lib/claude";
import { GeneratedCard } from "@/types";
import crypto from "crypto";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const { text, unitName, targetCount: targetCountRaw } = await req.json();

    if (!text || text.trim().length < 100) {
      return NextResponse.json(
        { error: "テキストが短すぎます。PDFにテキスト層が含まれているか確認してください。" },
        { status: 400 }
      );
    }

    const targetCount = Math.min(parseInt(targetCountRaw) || 100, 200);
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
