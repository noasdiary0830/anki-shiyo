export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // Dynamically import pdf-parse to avoid issues with Next.js
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse");
  const data = await pdfParse(buffer);
  return data.text;
}
