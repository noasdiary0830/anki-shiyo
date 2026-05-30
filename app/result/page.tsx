"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnkiNote } from "@/types";

interface ResultData {
  succeeded: number;
  failed: number;
  failedNotes: AnkiNote[];
}

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<ResultData | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("registrationResult");
    if (!raw) {
      router.replace("/");
      return;
    }
    setResult(JSON.parse(raw));
  }, [router]);

  const handleReset = () => {
    sessionStorage.clear();
    router.push("/");
  };

  if (!result) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{result.failed === 0 ? "🎉" : "⚠️"}</div>
          <h2 className="text-xl font-bold text-gray-900">登録完了</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{result.succeeded}</p>
            <p className="text-sm text-green-700 mt-1">登録成功</p>
          </div>
          <div
            className={`rounded-xl p-4 text-center border ${
              result.failed > 0
                ? "bg-red-50 border-red-200"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <p
              className={`text-3xl font-bold ${
                result.failed > 0 ? "text-red-600" : "text-gray-400"
              }`}
            >
              {result.failed}
            </p>
            <p
              className={`text-sm mt-1 ${
                result.failed > 0 ? "text-red-700" : "text-gray-500"
              }`}
            >
              登録失敗
            </p>
          </div>
        </div>

        {result.failedNotes.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              失敗した問題（重複の可能性）:
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {result.failedNotes.map((note, i) => (
                <div
                  key={i}
                  className="bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-red-700"
                >
                  {note.fields.Front}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleReset}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
        >
          新しいPDFを処理する
        </button>
      </div>
    </main>
  );
}
