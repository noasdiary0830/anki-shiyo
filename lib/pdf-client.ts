export async function extractTextFromPDFClient(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // Use the legacy worker served as a static asset from public/.
  // This is the most reliable approach across Next.js / Turbopack / Safari:
  // no bundler URL transformation needed, just a plain absolute path fetch.
  const worker = new Worker("/pdf.worker.legacy.min.mjs", { type: "module" });
  pdfjsLib.GlobalWorkerOptions.workerPort = worker;

  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
    disableFontFace: true,
  });

  const pdf = await loadingTask.promise;
  const total = pdf.numPages;

  const texts: string[] = [];
  try {
    for (let i = 1; i <= total; i++) {
      onProgress?.(i, total);
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      texts.push(pageText);
    }
  } finally {
    worker.terminate();
  }

  return texts.join("\n");
}
