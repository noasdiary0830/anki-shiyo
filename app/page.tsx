"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { GeneratedCard } from "@/types";
import { extractTextFromPDFClient } from "@/lib/pdf-client";

type Phase = "idle" | "extracting" | "generating" | "error";


export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [unitName, setUnitName] = useState("");
  const [targetCount, setTargetCount] = useState(100);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [pageProgress, setPageProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (f.type !== "application/pdf") {
      setError("PDFファイルを選択してください");
      return;
    }
    setFile(f);
    setError("");
    setUnitName((prev) => prev || f.name.replace(/\.pdf$/i, ""));
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("PDFファイルを選択してください");
      return;
    }

    setError("");

    try {
      // Step 1: Extract text in the browser (no size limit)
      setPhase("extracting");
      setProgress(10);
      setStatusMsg("PDFからテキストを抽出中...");

      const text = await extractTextFromPDFClient(file, (current, total) => {
        setPageProgress({ current, total });
        setProgress(Math.round((current / total) * 30) + 5);
        setStatusMsg(`PDFからテキストを抽出中... (${current}/${total}ページ)`);
      });

      if (!text || text.trim().length < 100) {
        throw new Error(
          "PDFからテキストを抽出できませんでした。スキャンPDF（画像のみ）は非対応です。"
        );
      }

      // Step 2: Send text to API
      setPhase("generating");
      setPageProgress(null);
      setProgress(40);
      setStatusMsg("Claude AIが問題を生成中...");

      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 3, 88));
      }, 2000);

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.slice(0, 100000), // ~100k chars is plenty for Claude
          unitName: unitName || file.name.replace(/\.pdf$/i, ""),
          targetCount,
        }),
      });

      clearInterval(interval);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "生成に失敗しました");
      }

      const data = await res.json();
      const cards: GeneratedCard[] = data.cards;

      setProgress(100);
      setStatusMsg(`${cards.length}問を生成しました！`);

      sessionStorage.setItem("generatedCards", JSON.stringify(cards));
      sessionStorage.setItem(
        "unitName",
        unitName || file.name.replace(/\.pdf$/i, "")
      );

      setTimeout(() => router.push("/review"), 600);
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    }
  };

  const isLoading = phase === "extracting" || phase === "generating";

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Anki問題自動生成</h1>
          <p className="text-gray-500 mt-2 text-sm">
            医学PDFをアップロードして問題を自動生成・Anki登録
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4 py-4">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-center text-gray-600">{statusMsg}</p>
            {pageProgress && (
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(pageProgress.current / pageProgress.total) * 100}%` }}
                />
              </div>
            )}
            {phase === "generating" && (
              <p className="text-xs text-center text-gray-400">
                ※ PDFの内容によって1〜2分かかる場合があります
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Drop zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                dragging
                  ? "border-blue-500 bg-blue-50"
                  : file
                  ? "border-green-400 bg-green-50"
                  : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) =>
                  e.target.files?.[0] && handleFile(e.target.files[0])
                }
              />
              {file ? (
                <div>
                  <div className="text-4xl mb-2">📄</div>
                  <p className="font-medium text-green-700">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(file.size / 1024 / 1024).toFixed(1)} MB &nbsp;·&nbsp;
                    テキスト抽出はブラウザ内で行うためサイズ制限なし
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-2">📁</div>
                  <p className="text-gray-600">PDFをドラッグ＆ドロップ</p>
                  <p className="text-xs text-gray-400 mt-1">
                    またはクリックして選択（サイズ制限なし）
                  </p>
                </div>
              )}
            </div>

            {error && (
              <p className="text-red-600 text-sm text-center">{error}</p>
            )}

            {/* Unit name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                単元名（デッキ名・タグに使用）
              </label>
              <input
                type="text"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                placeholder="例: 循環器内科 / 心不全"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Target count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                生成問題数:{" "}
                <span className="text-blue-600 font-semibold">
                  {targetCount}問
                </span>
              </label>
              <input
                type="range"
                min={10}
                max={200}
                step={10}
                value={targetCount}
                onChange={(e) => setTargetCount(parseInt(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>10問</span>
                <span>200問（最大）</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!file}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              問題を生成する
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
