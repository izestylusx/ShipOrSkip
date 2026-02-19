interface ExportPngParams {
  element: HTMLElement;
  onchainTxHash: string;
  fileName?: string;
}

function shortHash(value: string): string {
  if (value.length <= 14) return value;
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

function createWatermark(txHash: string): HTMLDivElement {
  const watermark = document.createElement("div");
  watermark.setAttribute("data-export-watermark", "true");
  watermark.textContent = `Onchain proof: ${shortHash(txHash)}`;
  watermark.style.position = "absolute";
  watermark.style.right = "16px";
  watermark.style.bottom = "16px";
  watermark.style.padding = "6px 10px";
  watermark.style.borderRadius = "9999px";
  watermark.style.background = "rgba(255,255,255,0.9)";
  watermark.style.border = "1px solid rgba(148, 163, 184, 0.65)";
  watermark.style.color = "#0f172a";
  watermark.style.fontSize = "12px";
  watermark.style.fontFamily = "monospace";
  watermark.style.zIndex = "20";
  return watermark;
}

export async function exportValidationPng({
  element,
  onchainTxHash,
  fileName,
}: ExportPngParams): Promise<void> {
  const { default: html2canvas } = await import("html2canvas");

  const priorPosition = element.style.position;
  const computedPosition = window.getComputedStyle(element).position;
  const shouldForceRelative = computedPosition === "static";
  if (shouldForceRelative) {
    element.style.position = "relative";
  }

  const watermark = createWatermark(onchainTxHash);
  element.appendChild(watermark);

  try {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    const canvas = await html2canvas(element, {
      backgroundColor: "#ffffff",
      scale: Math.min(window.devicePixelRatio || 1, 2),
      useCORS: true,
      logging: false,
      ignoreElements: (node) => node instanceof HTMLElement && node.dataset.exportIgnore === "true",
    });

    const dataUrl = canvas.toDataURL("image/png");
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = fileName ?? "ship-or-skip-analysis.png";
    anchor.click();
  } finally {
    watermark.remove();
    if (shouldForceRelative) {
      element.style.position = priorPosition;
    }
  }
}
