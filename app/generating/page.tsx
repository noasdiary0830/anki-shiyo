"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GeneratedCard } from "@/types";

interface ProgressState {
  message: string;
  pct: number;
}

export default function GeneratingPage() {
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressState>({
    message: "PDFを読み込み中...",
    pct: 5,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem("pendingGeneration");
    if (!raw) {
      router.replace("/");
      return;
    }

    const { pdfBase64, fileName, unitName, targetCount } = JSON.parse(raw);

    async function run() {
      try {
        setProgress({ message: "テキストを解析中...", pct: 15 });

        // Reconstruct File from base64
        const binaryStr = atob(pdfBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });
        const file = new File([blob], fileName, { type: "application/pdf" });

        const formData = new FormData();
        formData.append("pdf", file);
        formData.append("unitName", unitName);
        formData.append("targetCount", String(targetCount));

        setProgress({ message: "Claude AIが問題を生成中...", pct: 35 });

        // Animate progress while waiting
        const interval = setInterval(() => {
          setProgress((prev) => ({
            message: prev.pct < 80
              ? "補足解説をWeb検索中..."
              : "もうすぐ完了します...",
            pct: Math.min(prev.pct + 2, 90),
          }));
        }, 3000);

        const res = await fetch("/api/generate", {
          method: "POST",
          body: formData,
        });

        clearInterval(interval);

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "生成に失敗しました");
        }

        const data = await res.json();
        const cards: GeneratedCard[] = data.cards;

        setProgress({ message: "完了！", pct: 100 });

        sessionStorage.removeItem("pendingGeneration");
        sessionStorage.setItem("generatedCards", JSON.stringify(cards));
        sessionStorage.setItem("unitName", unitName);

        setTimeout(() => router.push("/review"), 500);
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      }
    }

    run();
  }, [router]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-6">問題を生成中...</h2>

        {error ? (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              {error}
            </div>
            <button
              onClick={() => router.push("/")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700"
            >
              最初に戻る
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress.pct}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">{progress.message}</p>
            <p className="text-xs text-gray-400">
              ※ Web検索による補足解説生成のため数分かかる場合があります
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
