import { AnkiNote } from "@/types";

const ANKI_CONNECT_URL = "http://localhost:8765";

async function ankiRequest(action: string, params: Record<string, unknown> = {}) {
  const response = await fetch(ANKI_CONNECT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, version: 6, params }),
  });

  if (!response.ok) {
    throw new Error(`AnkiConnect request failed: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`AnkiConnect error: ${data.error}`);
  }
  return data.result;
}

export async function getDeckNames(): Promise<string[]> {
  return ankiRequest("deckNames");
}

export async function getModelNames(): Promise<string[]> {
  return ankiRequest("modelNames");
}

// Return the best available "Basic" model name for this Anki installation.
export async function resolveBasicModel(): Promise<string> {
  const models: string[] = await getModelNames();
  // Prefer exact matches first, then substring matches
  const candidates = ["Basic", "基本", "基礎"];
  for (const c of candidates) {
    if (models.includes(c)) return c;
  }
  const partial = models.find(
    (m) => m.toLowerCase().includes("basic") || m.includes("基本")
  );
  if (partial) return partial;
  // Last resort: use first model that has Front/Back fields
  for (const m of models) {
    const fields: string[] = await ankiRequest("modelFieldNames", { modelName: m });
    if (fields.includes("Front") && fields.includes("Back")) return m;
    if (fields.includes("表面") && fields.includes("裏面")) return m;
  }
  return models[0];
}

export async function createDeck(deckName: string): Promise<void> {
  await ankiRequest("createDeck", { deck: deckName });
}

export interface AddNotesResult {
  succeeded: number;
  failed: number;
  failedNotes: AnkiNote[];
}

export async function addNotes(notes: AnkiNote[]): Promise<AddNotesResult> {
  const result = await ankiRequest("addNotes", { notes });

  const failedNotes: AnkiNote[] = [];
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < result.length; i++) {
    if (result[i] === null) {
      failed++;
      failedNotes.push(notes[i]);
    } else {
      succeeded++;
    }
  }

  return { succeeded, failed, failedNotes };
}

export async function checkAnkiConnect(): Promise<boolean> {
  try {
    await ankiRequest("version");
    return true;
  } catch {
    return false;
  }
}
