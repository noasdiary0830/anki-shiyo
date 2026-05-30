import Anthropic from "@anthropic-ai/sdk";

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY が設定されていません。Vercelの Settings → Environment Variables で ANTHROPIC_API_KEY を Production 環境に設定し、再デプロイしてください。"
    );
  }
  return new Anthropic({ apiKey });
}

export interface CardData {
  front: string;
  back: string;
  hasImage?: boolean;
}

export async function generateCards(
  text: string,
  unitName: string,
  targetCount: number
): Promise<CardData[]> {
  const client = getClient();
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    messages: [
      {
        role: "user",
        content: `以下の医学テキストから、医学的に重要な概念・事項を優先して${targetCount}問の一問一答カードを生成してください。

単元名: ${unitName}

テキスト:
${text.slice(0, 80000)}

以下のJSON形式で回答してください（他のテキストは含めないこと）:
{
  "cards": [
    {
      "front": "問題文",
      "back": "答え"
    }
  ]
}

要件:
- 医学的に重要な概念、定義、診断基準、治療法、数値を優先
- 問題は明確で一意の答えがあるものにする
- 答えは簡潔に（1〜3文程度）
- 日本語で生成すること`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");

  const parsed = JSON.parse(jsonMatch[0]);
  return parsed.cards || [];
}

export async function addWebSearchSupplement(
  front: string,
  back: string
): Promise<string> {
  try {
    const client = getClient();
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
        } as Parameters<typeof client.messages.create>[0]["tools"] extends Array<infer T> ? T : never,
      ],
      messages: [
        {
          role: "user",
          content: `以下の医学問題について、Web検索を使って補足説明を日本語で生成してください。

問題: ${front}
答え: ${back}

補足説明の要件:
- 最新の医学的知見や臨床的な重要ポイントを含める
- 200〜400文字程度
- 参考URLを1〜2件含める
- 以下のフォーマットで回答（他のテキストは含めない）:

※AI補足説明
[補足テキスト]
参考: [URL]`,
        },
      ],
    });

    for (const block of message.content) {
      if (block.type === "text" && block.text.includes("※AI補足説明")) {
        return "\n\n" + block.text.trim();
      }
    }
    return "";
  } catch {
    return "";
  }
}
