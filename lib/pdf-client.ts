export async function extractTextFromPDFClient(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");

  // Let the bundler resolve and bundle the worker, then run it via workerPort.
  // This is the most reliable approach across Next.js / Turbopack / Vercel.
  const worker = new Worker(
    new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url),
    { type: "module" }
  );
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
