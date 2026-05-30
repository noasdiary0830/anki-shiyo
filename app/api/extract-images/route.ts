import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

// PDF image extraction requires native bindings (pdfjs-dist canvas)
// which are not available in Vercel serverless. This endpoint returns
// an empty list and image cards are skipped in the initial version.
export async function POST(_req: NextRequest) {
  return NextResponse.json({ images: [] });
}
