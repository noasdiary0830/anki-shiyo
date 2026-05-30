"use client";

import { DeckConfig } from "@/types";

interface DeckSelectorProps {
  config: DeckConfig;
  existingDecks: string[];
  onChange: (config: DeckConfig) => void;
}

export default function DeckSelector({
  config,
  existingDecks,
  onChange,
}: DeckSelectorProps) {
  return (
    <div className="bg-white border rounded-lg p-5 space-y-4">
      <h3 className="font-semibold text-gray-800">デッキ設定</h3>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="deckMode"
            value="new"
            checked={config.mode === "new"}
            onChange={() => onChange({ ...config, mode: "new", deckName: "" })}
            className="accent-blue-600"
          />
          <span className="text-sm">新規デッキ作成</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="deckMode"
            value="existing"
            checked={config.mode === "existing"}
            onChange={() => onChange({ ...config, mode: "existing" })}
            className="accent-blue-600"
          />
          <span className="text-sm">既存デッキに追加</span>
        </label>
      </div>

      {config.mode === "new" ? (
        <input
          type="text"
          placeholder="新しいデッキ名を入力"
          value={config.deckName}
          onChange={(e) => onChange({ ...config, deckName: e.target.value })}
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <select
          value={config.deckName}
          onChange={(e) => onChange({ ...config, deckName: e.target.value })}
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">デッキを選択してください</option>
          {existingDecks.map((deck) => (
            <option key={deck} value={deck}>
              {deck}
            </option>
          ))}
        </select>
      )}

      <div>
        <label className="text-sm text-gray-600 block mb-1">
          タグ（カンマ区切り）
        </label>
        <input
          type="text"
          placeholder="例: 内科, 循環器, 心不全"
          value={config.tags.join(", ")}
          onChange={(e) =>
            onChange({
              ...config,
              tags: e.target.value
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            })
          }
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
