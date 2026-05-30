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

export interface BasicModelInfo {
  modelName: string;
  frontField: string;
  backField: string;
}

// Return the model name and actual field names for this Anki installation.
// Japanese Anki uses "基本" with fields "表面"/"裏面" instead of "Basic"/"Front"/"Back".
export async function resolveBasicModel(): Promise<BasicModelInfo> {
  const models: string[] = await getModelNames();

  const candidates = ["Basic", "基本", "基礎"];
  const orderedModels = [
    ...candidates.filter((c) => models.includes(c)),
    ...models.filter((m) => !candidates.includes(m)),
  ];

  for (const modelName of orderedModels) {
    const fields: string[] = await ankiRequest("modelFieldNames", { modelName });
    // English field names
    if (fields.includes("Front") && fields.includes("Back")) {
      return { modelName, frontField: "Front", backField: "Back" };
    }
    // Japanese field names
    if (fields.includes("表面") && fields.includes("裏面")) {
      return { modelName, frontField: "表面", backField: "裏面" };
    }
    // Generic: use first two fields
    if (fields.length >= 2) {
      return { modelName, frontField: fields[0], backField: fields[1] };
    }
  }

  return { modelName: models[0], frontField: "Front", backField: "Back" };
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
