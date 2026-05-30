export async function extractTextFromPDFClient(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");

  // Disable web worker — run on main thread (compatible with all environments)
  pdfjsLib.GlobalWorkerOptions.workerSrc = "";

  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
    disableFontFace: true,
  });

  const pdf = await loadingTask.promise;
  const total = pdf.numPages;

  const texts: string[] = [];
  for (let i = 1; i <= total; i++) {
    onProgress?.(i, total);
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    texts.push(pageText);
  }

  return texts.join("\n");
}
