"use client";

import { GeneratedCard } from "@/types";

interface CardPreviewProps {
  card: GeneratedCard;
  onToggle: (id: string) => void;
}

export default function CardPreview({ card, onToggle }: CardPreviewProps) {
  return (
    <div
      className={`border rounded-lg p-4 transition-all ${
        card.selected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 bg-gray-50 opacity-60"
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={card.selected}
          onChange={() => onToggle(card.id)}
          className="mt-1 h-4 w-4 cursor-pointer accent-blue-600"
        />
        <div className="flex-1 min-w-0">
          <div className="mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              表面（問題）
            </span>
            <div className="mt-1 text-sm text-gray-800 leading-relaxed">
              {card.imageBase64 && (
                <img
                  src={`data:${card.imageMimeType};base64,${card.imageBase64}`}
                  alt="問題画像"
                  className="max-w-full h-auto mb-2 rounded"
                />
              )}
              {card.front}
            </div>
          </div>
          <div className="border-t pt-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              裏面（答え）
            </span>
            <div className="mt-1 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {card.back}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
