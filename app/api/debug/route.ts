import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY
      ? `set (starts with: ${process.env.GEMINI_API_KEY.slice(0, 6)}...)`
      : "NOT SET",
    NODE_ENV: process.env.NODE_ENV,
  });
}
