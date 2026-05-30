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
