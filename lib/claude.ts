import { GoogleGenerativeAI } from "@google/generative-ai";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY が設定されていません。Vercelの Settings → Environment Variables で GEMINI_API_KEY を設定し、再デプロイしてください。"
    );
  }
  return new GoogleGenerativeAI(apiKey);
}

const MODEL = "gemini-1.5-flash";

export interface CardData {
  front: string;
  back: string;
}

export async function generateCards(
  text: string,
  unitName: string,
  targetCount: number
): Promise<CardData[]> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: MODEL });

  const prompt = `以下の医学テキストから、医学的に重要な概念・事項を優先して${targetCount}問の一問一答カードを生成してください。

単元名: ${unitName}

テキスト:
${text.slice(0, 80000)}

以下のJSON形式のみで回答してください（説明文・コードブロック等は不要）:
{"cards":[{"front":"問題文","back":"答え"}]}

要件:
- 医学的に重要な概念、定義、診断基準、治療法、数値を優先
- 問題は明確で一意の答えがあるものにする
- 答えは簡潔に（1〜3文程度）
- 日本語で生成すること`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("JSONが見つかりませんでした");

  const parsed = JSON.parse(jsonMatch[0]);
  return parsed.cards || [];
}

export async function addWebSearchSupplement(
  front: string,
  back: string
): Promise<string> {
  try {
    const genAI = getClient();
    const model = genAI.getGenerativeModel({ model: MODEL });

    const prompt = `以下の医学問題について、補足説明を日本語で生成してください。

問題: ${front}
答え: ${back}

補足説明の要件:
- 最新の医学的知見や臨床的な重要ポイントを含める
- 200〜400文字程度
- 以下のフォーマットのみで回答:

※AI補足説明
[補足テキスト]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    if (text.includes("※AI補足説明")) {
      return "\n\n" + text;
    }
    return "";
  } catch {
    return "";
  }
}
