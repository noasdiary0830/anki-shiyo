export async function extractTextFromPDFClient(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<string> {
  let pdfjsLib: typeof import("pdfjs-dist/legacy/build/pdf.mjs");
  try {
    pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  } catch (e) {
    throw new Error(
      `[PDF抽出:ライブラリ読込] ${e instanceof Error ? e.message : String(e)}`
    );
  }

  // Try to spin up a module worker. If the browser (e.g. older Safari)
  // rejects it, fall back to running pdf.js on the main thread.
  try {
    const worker = new Worker("/pdf.worker.legacy.min.mjs", { type: "module" });
    pdfjsLib.GlobalWorkerOptions.workerPort = worker;
  } catch {
    // Fake-worker / main-thread mode. Still needs a workerSrc value set.
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.legacy.min.mjs";
  }

  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await file.arrayBuffer();
  } catch (e) {
    throw new Error(
      `[PDF抽出:ファイル読込] ${e instanceof Error ? e.message : String(e)}`
    );
  }

  let pdf;
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      disableFontFace: true,
    });
    pdf = await loadingTask.promise;
  } catch (e) {
    throw new Error(
      `[PDF抽出:文書解析] ${e instanceof Error ? e.message : String(e)}`
    );
  }

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
  } catch (e) {
    throw new Error(
      `[PDF抽出:テキスト取得] ${e instanceof Error ? e.message : String(e)}`
    );
  }

  return texts.join("\n");
}
