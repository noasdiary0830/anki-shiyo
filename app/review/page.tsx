"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { GeneratedCard, DeckConfig, AnkiNote } from "@/types";
import CardPreview from "@/components/CardPreview";
import DeckSelector from "@/components/DeckSelector";
import {
  checkAnkiConnect,
  getDeckNames,
  createDeck,
  addNotes,
} from "@/lib/anki";

export default function ReviewPage() {
  const router = useRouter();
  const [cards, setCards] = useState<GeneratedCard[]>([]);
  const [unitName, setUnitName] = useState("");
  const [existingDecks, setExistingDecks] = useState<string[]>([]);
  const [deckConfig, setDeckConfig] = useState<DeckConfig>({
    mode: "new",
    deckName: "",
    tags: [],
  });
  const [ankiStatus, setAnkiStatus] = useState<"checking" | "ok" | "error">("checking");
  const [registering, setRegistering] = useState(false);
  const [ankiError, setAnkiError] = useState("");
  const [supplementProgress, setSupplementProgress] = useState<{
    done: number;
    total: number;
    running: boolean;
  }>({ done: 0, total: 0, running: false });
  const abortRef = useRef(false);

  useEffect(() => {
    const rawCards = sessionStorage.getItem("generatedCards");
    const rawUnit = sessionStorage.getItem("unitName");
    if (!rawCards) {
      router.replace("/");
      return;
    }
    const parsed: GeneratedCard[] = JSON.parse(rawCards);
    setCards(parsed);
    const unit = rawUnit || "医学";
    setUnitName(unit);
    setDeckConfig({ mode: "new", deckName: unit, tags: [unit] });

    checkAnkiConnect().then((ok) => {
      setAnkiStatus(ok ? "ok" : "error");
      if (ok) getDeckNames().then(setExistingDecks).catch(() => {});
    });

    // Auto-start supplement fetching
    fetchSupplements(parsed);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSupplements = useCallback(async (initialCards: GeneratedCard[]) => {
    abortRef.current = false;
    setSupplementProgress({ done: 0, total: initialCards.length, running: true });

    for (let i = 0; i < initialCards.length; i++) {
      if (abortRef.current) break;
      const card = initialCards[i];

      try {
        const res = await fetch("/api/supplement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ front: card.front, back: card.back }),
        });
        const data = await res.json();

        if (data.supplement) {
          setCards((prev) =>
            prev.map((c) =>
              c.id === card.id ? { ...c, back: c.back + data.supplement } : c
            )
          );
        }
      } catch {
        // silently skip on error
      }

      setSupplementProgress((prev) => ({ ...prev, done: i + 1 }));
    }

    setSupplementProgress((prev) => ({ ...prev, running: false }));
  }, []);

  const toggleCard = (id: string) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  const selectedCards = cards.filter((c) => c.selected);

  const handleRegister = async () => {
    if (!deckConfig.deckName) {
      alert("デッキ名を入力してください");
      return;
    }
    if (selectedCards.length === 0) {
      alert("登録する問題を選択してください");
      return;
    }

    // Stop supplement fetching
    abortRef.current = true;

    setRegistering(true);
    setAnkiError("");

    try {
      if (deckConfig.mode === "new") {
        await createDeck(deckConfig.deckName);
      }

      const notes: AnkiNote[] = selectedCards.map((card) => {
        const note: AnkiNote = {
          deckName: deckConfig.deckName,
          modelName: "Basic",
          fields: {
            Front: card.front,
            Back: card.back,
          },
          tags: deckConfig.tags,
        };

        if (card.imageBase64 && card.imageMimeType) {
          const ext = card.imageMimeType.split("/")[1] || "png";
          const filename = `anki-shiyo-${card.id}.${ext}`;
          note.fields.Front = `<img src="${filename}"><br>${card.front}`;
          note.picture = [
            { data: card.imageBase64, filename, fields: ["Front"] },
          ];
        }

        return note;
      });

      const result = await addNotes(notes);

      sessionStorage.setItem(
        "registrationResult",
        JSON.stringify({
          succeeded: result.succeeded,
          failed: result.failed,
          failedNotes: result.failedNotes,
        })
      );

      router.push("/result");
    } catch (err) {
      setAnkiError(
        err instanceof Error ? err.message : "Anki登録中にエラーが発生しました"
      );
    } finally {
      setRegistering(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">問題確認・選択</h1>
            <p className="text-sm text-gray-500 mt-1">
              {unitName} — {cards.length}問生成
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setCards((prev) => prev.map((c) => ({ ...c, selected: true })))
              }
              className="text-xs border rounded-lg px-3 py-1.5 hover:bg-gray-100"
            >
              全選択
            </button>
            <button
              onClick={() =>
                setCards((prev) => prev.map((c) => ({ ...c, selected: false })))
              }
              className="text-xs border rounded-lg px-3 py-1.5 hover:bg-gray-100"
            >
              全解除
            </button>
          </div>
        </div>

        {/* Supplement progress */}
        {supplementProgress.running && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-blue-700">
                補足解説をWeb検索中... ({supplementProgress.done}/{supplementProgress.total})
              </span>
              <button
                onClick={() => { abortRef.current = true; setSupplementProgress(p => ({ ...p, running: false })); }}
                className="text-xs text-blue-500 hover:underline"
              >
                スキップ
              </button>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all"
                style={{
                  width: `${(supplementProgress.done / supplementProgress.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* AnkiConnect status */}
        {ankiStatus === "error" && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 text-sm text-yellow-800">
            <strong>AnkiConnectに接続できません。</strong> Ankiが起動しているか確認してください。
            CORSの設定も必要です（README参照）。
          </div>
        )}

        {/* Card list */}
        <div className="space-y-3">
          {cards.map((card) => (
            <CardPreview key={card.id} card={card} onToggle={toggleCard} />
          ))}
        </div>

        {/* Deck settings */}
        <DeckSelector
          config={deckConfig}
          existingDecks={existingDecks}
          onChange={setDeckConfig}
        />

        {ankiError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {ankiError}
          </div>
        )}

        {/* Register button */}
        <div className="sticky bottom-4 bg-white rounded-xl shadow-lg p-4 border flex items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-blue-600">{selectedCards.length}問</span>{" "}
            を選択中
          </p>
          <button
            onClick={handleRegister}
            disabled={
              registering || selectedCards.length === 0 || ankiStatus !== "ok"
            }
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {registering ? "登録中..." : "選択した問題をAnkiに登録"}
          </button>
        </div>
      </div>
    </main>
  );
}
