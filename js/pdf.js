// Résumé PDFs: text is extracted in the browser with pdf.js (loaded on first use).
const PDFJS = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build";
export const MAX_PDF_BYTES = 10 * 1024 * 1024;

let pdfjsPromise;
function loadPdfJs() {
  pdfjsPromise ??= import(`${PDFJS}/pdf.min.mjs`).then((lib) => {
    lib.GlobalWorkerOptions.workerSrc = `${PDFJS}/pdf.worker.min.mjs`;
    return lib;
  });
  return pdfjsPromise;
}

// Returns { text, pages }. text is empty for scanned, image-only PDFs.
export async function extractPdfText(file) {
  const lib = await loadPdfJs();
  // isEvalSupported: false keeps pdf.js from probing eval(), which the page's security policy blocks.
  const doc = await lib.getDocument({ data: await file.arrayBuffer(), isEvalSupported: false }).promise;
  const pages = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const content = await (await doc.getPage(n)).getTextContent();
    let line = "";
    const lines = [];
    for (const item of content.items) {
      line += item.str;
      if (item.hasEOL) { lines.push(line); line = ""; } else if (item.str && !line.endsWith(" ")) line += " ";
    }
    if (line.trim()) lines.push(line);
    pages.push(lines.map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n"));
  }
  return { text: pages.join("\n\n").trim(), pages: doc.numPages };
}

export async function fileToBase64(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}
