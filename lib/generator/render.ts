import QRCode from "qrcode";

import { fitText } from "./text-fitting";
import {
  applyTextTransform,
  type TemplateConfigParsed,
  templateConfigSchema,
} from "./template-config";

export type RenderInput = {
  /** Already-loaded template image (HTMLImageElement is convenient because it
   * supports natural width / height without re-decoding). */
  template: HTMLImageElement;
  /** Position config (raw — gets parsed inside so defaults apply). */
  config: unknown;
  /** Per-row data fed to the renderer. */
  data: {
    full_name: string;
    student_code: string;
    verification_code: string;
    /** Full URL to embed in the QR. Pre-resolved so the renderer doesn't need
     * to know about envs. */
    qr_payload: string;
  };
};

export type RenderResult = {
  canvas: HTMLCanvasElement;
  warnings: string[];
};

/**
 * Render a single certificate onto a fresh canvas. Pure function — does not
 * touch the DOM or rely on any global state.
 *
 * The renderer always draws at the template's natural pixel size so the
 * resulting PNG is bit-identical regardless of viewport. Callers that need a
 * thumbnail should scale the canvas down themselves (e.g. via CSS).
 */
export async function renderCertificate(
  input: RenderInput,
): Promise<RenderResult> {
  const config = templateConfigSchema.parse(input.config);
  const { template } = input;

  const canvas = document.createElement("canvas");
  canvas.width = template.naturalWidth;
  canvas.height = template.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Trình duyệt không hỗ trợ Canvas 2D.");
  }

  ctx.drawImage(template, 0, 0);
  ctx.textBaseline = "middle";

  const warnings: string[] = [];

  // 1) Full name — uses the fitting algorithm.
  const nameFit = drawTextBox(ctx, input.data.full_name, config.fullName);
  if (nameFit.overflow) {
    warnings.push("Họ tên không vừa khung cho dù đã chia 2 dòng.");
  }

  // 2) Student code — also fitted but typically a single short line.
  const codeFit = drawTextBox(ctx, input.data.student_code, config.studentCode);
  if (codeFit.overflow) {
    warnings.push("MSSV không vừa khung.");
  }

  // 3) Verification code — optional, single line.
  if (config.verificationCode) {
    drawTextBox(ctx, input.data.verification_code, config.verificationCode);
  }

  // 4) QR — optional.
  if (config.qrCode) {
    await drawQrCode(ctx, input.data.qr_payload, config.qrCode);
  }

  return { canvas, warnings };
}

function drawTextBox(
  ctx: CanvasRenderingContext2D,
  text: string,
  box: TemplateConfigParsed["fullName"],
) {
  ctx.save();
  ctx.fillStyle = box.color;
  ctx.textAlign = box.align;

  const displayText = applyTextTransform(text, box.textTransform);
  const fit = fitText(ctx, displayText, {
    maxWidth: box.width,
    maxFontSize: box.fontSize,
    minFontSize: box.minFontSize,
    fontFamily: box.fontFamily,
    fontWeight: box.fontWeight,
    wrapMode: box.wrapMode,
    wrapWordThreshold: box.wrapWordThreshold,
  });

  // Vertically centre the (possibly multi-line) block within the box.
  const lineHeightPx = fit.fontSize * box.lineHeight;
  const totalHeight = lineHeightPx * fit.lines.length;
  const startY = box.y + (box.height - totalHeight) / 2 + lineHeightPx / 2;

  let drawX: number;
  switch (box.align) {
    case "left":
      drawX = box.x;
      break;
    case "right":
      drawX = box.x + box.width;
      break;
    default:
      drawX = box.x + box.width / 2;
  }

  for (let i = 0; i < fit.lines.length; i++) {
    ctx.fillText(fit.lines[i], drawX, startY + i * lineHeightPx);
  }

  ctx.restore();
  return fit;
}

async function drawQrCode(
  ctx: CanvasRenderingContext2D,
  payload: string,
  box: TemplateConfigParsed["qrCode"] & object,
) {
  // Render QR onto an offscreen canvas at the configured size, then blit.
  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, payload, {
    width: box.size,
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#0f172a", light: "#ffffff" },
  });
  ctx.drawImage(qrCanvas, box.x, box.y, box.size, box.size);
}

/** Convenience: load an image file (or data URL string) into an
 * HTMLImageElement so the renderer can read `naturalWidth` / `naturalHeight`. */
export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error("Không thể nạp ảnh template. Kiểm tra lại file."));
    img.src = src;
  });
}

/** Read an uploaded File into a data URL (so it can survive React state
 * across re-renders without leaking blob URLs). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
