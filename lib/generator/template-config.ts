import { z } from "zod";

export const textTransformSchema = z.enum(["none", "uppercase"]);
export type TextTransform = z.infer<typeof textTransformSchema>;
export const textWrapModeSchema = z.enum(["shrink", "wrap_long"]);
export type TextWrapMode = z.infer<typeof textWrapModeSchema>;

/**
 * Where to draw a piece of text on the certificate template. Coordinates are
 * in pixels relative to the natural template image dimensions, with (0,0) in
 * the top-left.
 *
 * `align` controls how the text is laid out within the bounding box. `font`
 * defaults to a stack that includes a Vietnamese-friendly fallback so
 * diacritics render correctly.
 */
export const textBoxSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  width: z.number().int().min(1),
  height: z.number().int().min(1),
  fontSize: z.number().int().min(8).max(400).default(64),
  minFontSize: z.number().int().min(8).max(400).default(28),
  fontFamily: z
    .string()
    .min(1)
    .default(
      "'Be Vietnam Pro', 'Inter', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif",
    ),
  fontWeight: z.enum(["400", "500", "600", "700", "800"]).default("700"),
  textTransform: textTransformSchema.default("none"),
  wrapMode: textWrapModeSchema.default("shrink"),
  wrapWordThreshold: z.number().int().min(2).max(10).default(4),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/u, "Mã màu phải có dạng #rrggbb.")
    .default("#1f2937"),
  align: z.enum(["left", "center", "right"]).default("center"),
  lineHeight: z.number().min(0.8).max(2.4).default(1.15),
});
export type TextBox = z.input<typeof textBoxSchema>;

export function applyTextTransform(
  text: string,
  transform: TextTransform | undefined,
): string {
  if (transform === "uppercase") {
    return text.toLocaleUpperCase("vi-VN");
  }
  return text;
}

/**
 * QR code position. Always rendered as a square; the side length is `size`.
 */
export const qrBoxSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  size: z.number().int().min(40).max(2000),
});
export type QrBox = z.input<typeof qrBoxSchema>;

/**
 * Full template configuration stored in `campaigns.template_config` (jsonb).
 * Coordinates assume the source template has pixel-perfect dimensions; we
 * persist `templateWidth` / `templateHeight` so the renderer can validate
 * that the uploaded template still matches.
 */
export const templateConfigSchema = z.object({
  templateWidth: z.number().int().min(1).optional(),
  templateHeight: z.number().int().min(1).optional(),
  fullName: textBoxSchema,
  studentCode: textBoxSchema,
  verificationCode: textBoxSchema.optional(),
  qrCode: qrBoxSchema.optional(),
});
export type TemplateConfig = z.input<typeof templateConfigSchema>;
export type TemplateConfigParsed = z.output<typeof templateConfigSchema>;

/**
 * Sensible defaults targeting an A4-landscape PNG at 300 DPI (3508 × 2480).
 * Real PDP templates won't match these exactly, but they're a reasonable
 * starting point that admins can tweak in the position-config form.
 */
export const DEFAULT_TEMPLATE_CONFIG: TemplateConfig = {
  fullName: {
    x: 504,
    y: 1100,
    width: 2500,
    height: 220,
    fontSize: 130,
    minFontSize: 60,
    color: "#0f172a",
    align: "center",
    fontWeight: "700",
    textTransform: "none",
    wrapMode: "wrap_long",
    wrapWordThreshold: 4,
    lineHeight: 1.1,
  },
  studentCode: {
    x: 504,
    y: 1380,
    width: 2500,
    height: 90,
    fontSize: 64,
    minFontSize: 36,
    color: "#475569",
    align: "center",
    fontWeight: "500",
    lineHeight: 1.1,
  },
  verificationCode: {
    x: 200,
    y: 2300,
    width: 1200,
    height: 56,
    fontSize: 28,
    minFontSize: 18,
    color: "#64748b",
    align: "left",
    fontWeight: "400",
    lineHeight: 1.1,
  },
  qrCode: {
    x: 3100,
    y: 2080,
    size: 320,
  },
};

export function createTemplateConfigForImage(
  width: number,
  height: number,
): TemplateConfig {
  const aspectRatio = width / height;

  if (aspectRatio >= 2 && height <= 1400) {
    return {
      templateWidth: width,
      templateHeight: height,
      fullName: {
        x: Math.round(width * 0.525),
        y: Math.round(height * 0.425),
        width: Math.round(width * 0.155),
        height: Math.round(height * 0.105),
        fontSize: Math.round(height * 0.04),
        minFontSize: Math.round(height * 0.022),
        color: "#111827",
        align: "center",
        fontWeight: "700",
        textTransform: "none",
        wrapMode: "wrap_long",
        wrapWordThreshold: 4,
        lineHeight: 1.05,
      },
      studentCode: {
        x: Math.round(width * 0.525),
        y: Math.round(height * 0.57),
        width: Math.round(width * 0.155),
        height: Math.round(height * 0.07),
        fontSize: Math.round(height * 0.034),
        minFontSize: Math.round(height * 0.02),
        color: "#111827",
        align: "center",
        fontWeight: "700",
        lineHeight: 1.05,
      },
      verificationCode: {
        x: Math.round(width * 0.64),
        y: Math.round(height * 0.83),
        width: Math.round(width * 0.18),
        height: Math.round(height * 0.045),
        fontSize: Math.round(height * 0.017),
        minFontSize: Math.round(height * 0.013),
        color: "#64748b",
        align: "left",
        fontWeight: "400",
        lineHeight: 1.1,
      },
      qrCode: {
        x: Math.round(width * 0.86),
        y: Math.round(height * 0.73),
        size: Math.round(height * 0.13),
      },
    };
  }

  const baseWidth = 3508;
  const baseHeight = 2480;
  const scaleX = width / baseWidth;
  const scaleY = height / baseHeight;
  const scaleText = Math.min(scaleX, scaleY);

  return {
    templateWidth: width,
    templateHeight: height,
    fullName: scaleTextBox(DEFAULT_TEMPLATE_CONFIG.fullName, scaleX, scaleY, scaleText),
    studentCode: scaleTextBox(
      DEFAULT_TEMPLATE_CONFIG.studentCode,
      scaleX,
      scaleY,
      scaleText,
    ),
    verificationCode: DEFAULT_TEMPLATE_CONFIG.verificationCode
      ? scaleTextBox(
          DEFAULT_TEMPLATE_CONFIG.verificationCode,
          scaleX,
          scaleY,
          scaleText,
        )
      : undefined,
    qrCode: DEFAULT_TEMPLATE_CONFIG.qrCode
      ? {
          x: Math.round(DEFAULT_TEMPLATE_CONFIG.qrCode.x * scaleX),
          y: Math.round(DEFAULT_TEMPLATE_CONFIG.qrCode.y * scaleY),
          size: Math.round(
            DEFAULT_TEMPLATE_CONFIG.qrCode.size * Math.min(scaleX, scaleY),
          ),
        }
      : undefined,
  };
}

function scaleTextBox(
  box: NonNullable<TemplateConfig["fullName"]>,
  scaleX: number,
  scaleY: number,
  scaleText: number,
): NonNullable<TemplateConfig["fullName"]> {
  return {
    ...box,
    x: Math.round(box.x * scaleX),
    y: Math.round(box.y * scaleY),
    width: Math.round(box.width * scaleX),
    height: Math.round(box.height * scaleY),
    fontSize: Math.round((box.fontSize ?? 64) * scaleText),
    minFontSize: Math.round((box.minFontSize ?? 28) * scaleText),
  };
}
