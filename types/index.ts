export interface GeneratedCard {
  id: string;
  type: "text" | "image";
  front: string;
  back: string;
  imageBase64?: string;
  imageMimeType?: string;
  selected: boolean;
}

export interface GenerationProgress {
  status: "idle" | "extracting" | "generating" | "searching" | "done" | "error";
  message: string;
  current?: number;
  total?: number;
}

export interface DeckConfig {
  mode: "new" | "existing";
  deckName: string;
  tags: string[];
}

export interface AnkiNote {
  deckName: string;
  modelName: string;
  fields: Record<string, string>;
  tags: string[];
  picture?: {
    data: string;
    filename: string;
    fields: string[];
  }[];
}

export interface GenerateResponse {
  cards: GeneratedCard[];
  error?: string;
}

export interface ExtractImagesResponse {
  images: { base64: string; mimeType: string; pageIndex: number }[];
  error?: string;
}
