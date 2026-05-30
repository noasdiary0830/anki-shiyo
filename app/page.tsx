"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [unitName, setUnitName] = useState("");
  const [targetCount, setTargetCount] = useState(100);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (f: File) => {
      if (f.type !== "application/pdf") {
        setError("PDFファイルを選択してください");
        return;
      }
      setFile(f);
      setError("");
      setUnitName((prev) => prev || f.name.replace(/\.pdf$/i, ""));
    },
    []
  );

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

    const buffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(buffer).reduce((d, b) => d + String.fromCharCode(b), "")
    );

    sessionStorage.setItem(
      "pendingGeneration",
      JSON.stringify({ pdfBase64: base64, fileName: file.name, unitName, targetCount })
    );

    router.push("/generating");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Anki問題自動生成</h1>
          <p className="text-gray-500 mt-2 text-sm">
            医学PDFをアップロードして問題を自動生成・Anki登録
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragging
                ? "border-blue-500 bg-blue-50"
                : file
                ? "border-green-400 bg-green-50"
                : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {file ? (
              <div>
                <div className="text-4xl mb-2">📄</div>
                <p className="font-medium text-green-700">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div>
                <div className="text-4xl mb-2">📁</div>
                <p className="text-gray-600">PDFをドラッグ＆ドロップ</p>
                <p className="text-xs text-gray-400 mt-1">またはクリックして選択</p>
              </div>
            )}
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              生成問題数:{" "}
              <span className="text-blue-600 font-semibold">{targetCount}問</span>
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
      </div>
    </main>
  );
}
