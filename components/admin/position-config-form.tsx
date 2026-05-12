"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  CaseUpperIcon,
  WrapTextIcon,
  MoveIcon,
  RotateCcwIcon,
  ScanQrCodeIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TemplateMeta } from "@/components/admin/template-uploader";
import {
  applyTextTransform,
  createTemplateConfigForImage,
  DEFAULT_TEMPLATE_CONFIG,
  type TemplateConfig,
} from "@/lib/generator/template-config";
import {
  shouldWrapByWordCount,
  splitBalancedLines,
} from "@/lib/generator/text-fitting";

type TextFieldKey = "fullName" | "studentCode" | "verificationCode";
type ActiveField = TextFieldKey | "qrCode";
type TextBox = NonNullable<TemplateConfig["fullName"]>;

type PreviewSample = {
  full_name?: string;
  student_code?: string;
  verification_code?: string;
};

type Interaction =
  | {
      kind: "move";
      field: ActiveField;
      startX: number;
      startY: number;
      startBox: TextBox | NonNullable<TemplateConfig["qrCode"]>;
    }
  | {
      kind: "resize";
      field: ActiveField;
      startX: number;
      startY: number;
      startBox: TextBox | NonNullable<TemplateConfig["qrCode"]>;
    };

const FIELD_META: Array<{
  key: ActiveField;
  label: string;
  hint: string;
}> = [
  {
    key: "fullName",
    label: "Họ và tên",
    hint: "Kéo vùng này tới vị trí tên sinh viên trên template.",
  },
  {
    key: "studentCode",
    label: "MSSV",
    hint: "Kéo vùng này tới vị trí mã số sinh viên.",
  },
  {
    key: "verificationCode",
    label: "Mã xác minh",
    hint: "Tuỳ chọn, thường đặt nhỏ ở góc dưới hoặc sau chứng nhận.",
  },
  {
    key: "qrCode",
    label: "QR",
    hint: "Kéo và resize vùng QR nếu template cần mã xác minh trực tiếp.",
  },
];

export function PositionConfigForm({
  config,
  onChange,
  template,
  sample,
}: {
  config: TemplateConfig;
  onChange: (next: TemplateConfig) => void;
  template: TemplateMeta | null;
  sample?: PreviewSample | null;
}) {
  const [activeField, setActiveField] = useState<ActiveField>("fullName");
  const [previewWidth, setPreviewWidth] = useState(0);
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const [zoom, setZoom] = useState(1.25);

  const scale = template && previewWidth > 0 ? previewWidth / template.width : 1;
  const activeMeta = FIELD_META.find((field) => field.key === activeField);

  const reset = () => {
    if (template) {
      onChange(createTemplateConfigForImage(template.width, template.height));
    } else {
      onChange(structuredClone(DEFAULT_TEMPLATE_CONFIG));
    }
  };

  const updateTextBox = useCallback((
    key: TextFieldKey,
    patch: Partial<TextBox>,
  ): void => {
    const current = config[key];
    if (!current) return;
    onChange({
      ...config,
      [key]: { ...current, ...patch },
    });
  }, [config, onChange]);

  const updateQr = useCallback((
    patch: Partial<NonNullable<TemplateConfig["qrCode"]>>,
  ): void => {
    const current = config.qrCode;
    if (!current) return;
    onChange({ ...config, qrCode: { ...current, ...patch } });
  }, [config, onChange]);

  const positionActiveHorizontally = (position: "left" | "center" | "right") => {
    if (!template) return;
    if (activeField === "qrCode") {
      const qr = config.qrCode;
      if (!qr) return;
      updateQr({
        x: horizontalPosition(position, template.width, qr.size),
      });
      return;
    }

    const box = config[activeField];
    if (!box) return;
    updateTextBox(activeField, {
      x: horizontalPosition(position, template.width, box.width),
    });
  };

  const alignActiveText = (align: "left" | "center" | "right") => {
    if (activeField === "qrCode") return;
    updateTextBox(activeField, { align });
  };

  const setActiveTextTransform = (textTransform: TextBox["textTransform"]) => {
    if (activeField !== "fullName") return;
    updateTextBox(activeField, { textTransform });
  };

  const setActiveFontWeight = (fontWeight: TextBox["fontWeight"]) => {
    if (activeField === "qrCode") return;
    updateTextBox(activeField, { fontWeight });
  };

  const setActiveWrapMode = (wrapMode: TextBox["wrapMode"]) => {
    if (activeField !== "fullName") return;
    updateTextBox(activeField, { wrapMode });
  };

  useEffect(() => {
    if (!interaction || !template) return;

    const onPointerMove = (event: PointerEvent) => {
      event.preventDefault();

      const deltaX = Math.round((event.clientX - interaction.startX) / scale);
      const deltaY = Math.round((event.clientY - interaction.startY) / scale);

      if (interaction.field === "qrCode") {
        const startBox =
          interaction.startBox as NonNullable<TemplateConfig["qrCode"]>;

        if (interaction.kind === "move") {
          updateQr({
            x: clamp(startBox.x + deltaX, 0, template.width - startBox.size),
            y: clamp(startBox.y + deltaY, 0, template.height - startBox.size),
          });
        } else {
          const size = clamp(
            startBox.size + Math.max(deltaX, deltaY),
            40,
            Math.min(template.width - startBox.x, template.height - startBox.y),
          );
          updateQr({ size });
        }
        return;
      }

      const field = interaction.field;
      const startBox = interaction.startBox as TextBox;

      if (interaction.kind === "move") {
        updateTextBox(field, {
          x: clamp(startBox.x + deltaX, 0, template.width - startBox.width),
          y: clamp(startBox.y + deltaY, 0, template.height - startBox.height),
        });
      } else {
        updateTextBox(field, {
          width: clamp(startBox.width + deltaX, 40, template.width - startBox.x),
          height: clamp(
            startBox.height + deltaY,
            24,
            template.height - startBox.y,
          ),
        });
      }
    };

    const onPointerUp = () => setInteraction(null);

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [interaction, scale, template, updateQr, updateTextBox]);

  const fieldLabels = useMemo(
    () => FIELD_META.filter((field) => field.key !== "qrCode" || config.qrCode),
    [config.qrCode],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium">Chỉnh trực tiếp trên template</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Chọn vùng cần chỉnh, kéo để đổi vị trí, kéo góc phải dưới để đổi
            kích thước. Vùng chỉnh đang hiển thị lớn hơn để thao tác chính xác.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcwIcon aria-hidden />
            Tự đặt lại
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {fieldLabels.map((field) => (
          <Button
            key={field.key}
            type="button"
            variant={activeField === field.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveField(field.key)}
            className={
              activeField === field.key
                ? "bg-pdp-orange hover:bg-pdp-orange/90 text-white"
                : undefined
            }
          >
            {field.key === "qrCode" ? (
              <ScanQrCodeIcon aria-hidden />
            ) : (
              <MoveIcon aria-hidden />
            )}
            {field.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground mr-1 text-xs font-medium">
            Căn vùng
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => positionActiveHorizontally("left")}
          >
            <AlignLeftIcon aria-hidden />
            Trái
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => positionActiveHorizontally("center")}
          >
            <AlignCenterIcon aria-hidden />
            Giữa
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => positionActiveHorizontally("right")}
          >
            <AlignRightIcon aria-hidden />
            Phải
          </Button>
        </div>

        {activeField !== "qrCode" ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground mr-1 text-xs font-medium">
              Căn chữ
            </span>
            {(["left", "center", "right"] as const).map((align) => (
              <Button
                key={align}
                type="button"
                variant={
                  config[activeField]?.align === align ? "default" : "outline"
                }
                size="sm"
                onClick={() => alignActiveText(align)}
                className={
                  config[activeField]?.align === align
                    ? "bg-pdp-orange hover:bg-pdp-orange/90 text-white"
                    : undefined
                }
              >
                {align === "left" ? <AlignLeftIcon aria-hidden /> : null}
                {align === "center" ? <AlignCenterIcon aria-hidden /> : null}
                {align === "right" ? <AlignRightIcon aria-hidden /> : null}
                {align === "left" ? "Trái" : align === "center" ? "Giữa" : "Phải"}
              </Button>
            ))}
          </div>
        ) : null}

        {activeField === "fullName" ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground mr-1 text-xs font-medium">
              Kiểu tên
            </span>
            {(["none", "uppercase"] as const).map((textTransform) => (
              <Button
                key={textTransform}
                type="button"
                variant={
                  (config.fullName.textTransform ?? "none") === textTransform
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => setActiveTextTransform(textTransform)}
                className={
                  (config.fullName.textTransform ?? "none") === textTransform
                    ? "bg-pdp-orange hover:bg-pdp-orange/90 text-white"
                    : undefined
                }
              >
                <CaseUpperIcon aria-hidden />
                {textTransform === "uppercase" ? "IN HOA" : "Giữ nguyên"}
              </Button>
            ))}
          </div>
        ) : null}

        {activeField === "fullName" ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground mr-1 text-xs font-medium">
              Tên dài
            </span>
            {(["shrink", "wrap_long"] as const).map((wrapMode) => (
              <Button
                key={wrapMode}
                type="button"
                variant={
                  (config.fullName.wrapMode ?? "shrink") === wrapMode
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => setActiveWrapMode(wrapMode)}
                className={
                  (config.fullName.wrapMode ?? "shrink") === wrapMode
                    ? "bg-pdp-orange hover:bg-pdp-orange/90 text-white"
                    : undefined
                }
              >
                <WrapTextIcon aria-hidden />
                {wrapMode === "wrap_long" ? "Xuống dòng > 4 chữ" : "Co 1 dòng"}
              </Button>
            ))}
          </div>
        ) : null}

        {activeField !== "qrCode" ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground mr-1 text-xs font-medium">
              Độ đậm
            </span>
            {[
              ["400", "Thường"],
              ["600", "Vừa"],
              ["700", "Đậm"],
            ].map(([fontWeight, label]) => (
              <Button
                key={fontWeight}
                type="button"
                variant={
                  config[activeField]?.fontWeight === fontWeight
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() =>
                  setActiveFontWeight(fontWeight as TextBox["fontWeight"])
                }
                className={
                  config[activeField]?.fontWeight === fontWeight
                    ? "bg-pdp-orange hover:bg-pdp-orange/90 text-white"
                    : undefined
                }
              >
                <BoldIcon aria-hidden />
                {label}
              </Button>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground mr-1 text-xs font-medium">
            Phóng
          </span>
          {([1, 1.25, 1.5] as const).map((value) => (
            <Button
              key={value}
              type="button"
              variant={zoom === value ? "default" : "outline"}
              size="sm"
              onClick={() => setZoom(value)}
              className={
                zoom === value
                  ? "bg-pdp-orange hover:bg-pdp-orange/90 text-white"
                  : undefined
              }
            >
              {value === 1 ? "Vừa khung" : `${Math.round(value * 100)}%`}
            </Button>
          ))}
        </div>
      </div>

      {template ? (
        <div className="space-y-3">
          <div className="bg-muted overflow-auto rounded-lg border p-3">
            <div
              className="relative mx-auto select-none overflow-hidden rounded border bg-white shadow-sm"
              style={{
                aspectRatio: `${template.width} / ${template.height}`,
                maxWidth: template.width,
                width: `${zoom * 100}%`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={template.dataUrl}
                alt="Template chứng nhận"
                className="h-auto w-full"
                draggable={false}
                onLoad={(event) =>
                  setPreviewWidth(event.currentTarget.clientWidth)
                }
              />
              <ResizeProbe onResize={setPreviewWidth} />
              <TextOverlay
                field="fullName"
                label="Họ và tên"
                value={sample?.full_name ?? "NGUYEN VAN A"}
                box={config.fullName}
                scale={scale}
                active={activeField === "fullName"}
                onSelect={setActiveField}
                onPointerStart={setInteraction}
              />
              <TextOverlay
                field="studentCode"
                label="MSSV"
                value={sample?.student_code ?? "PS43995"}
                box={config.studentCode}
                scale={scale}
                active={activeField === "studentCode"}
                onSelect={setActiveField}
                onPointerStart={setInteraction}
              />
              {config.verificationCode ? (
                <TextOverlay
                  field="verificationCode"
                  label="Mã xác minh"
                  value={sample?.verification_code ?? "demo-pp-001"}
                  box={config.verificationCode}
                  scale={scale}
                  active={activeField === "verificationCode"}
                  onSelect={setActiveField}
                  onPointerStart={setInteraction}
                />
              ) : null}
              {config.qrCode ? (
                <QrOverlay
                  box={config.qrCode}
                  scale={scale}
                  active={activeField === "qrCode"}
                  onSelect={setActiveField}
                  onPointerStart={setInteraction}
                />
              ) : null}
            </div>
          </div>
          <div className="rounded-lg border px-4 py-3">
            <p className="text-sm font-medium">
              {activeMeta?.label ?? "Vùng đang chọn"}
              {activeField !== "qrCode" && config[activeField]?.align ? (
                <span className="text-muted-foreground ml-2 font-normal">
                  Căn chữ: {alignLabel(config[activeField]?.align)}
                  {activeField === "fullName"
                    ? ` · Kiểu tên: ${textTransformLabel(config.fullName.textTransform)} · Tên dài: ${wrapModeLabel(config.fullName.wrapMode)}`
                    : ""}
                </span>
              ) : null}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {activeMeta?.hint} Template:{" "}
              {template.width.toLocaleString("vi-VN")} ×{" "}
              {template.height.toLocaleString("vi-VN")} px.
            </p>
          </div>
        </div>
      ) : (
        <div className="border-border/70 bg-muted/40 rounded-lg border border-dashed px-4 py-8 text-center">
          <p className="font-medium">Tải template trước để chỉnh trực quan.</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Sau khi có ảnh template, vùng Họ tên/MSSV/QR sẽ hiện trực tiếp trên
            ảnh để kéo thả.
          </p>
        </div>
      )}

      <details className="rounded-lg border">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
          Cấu hình nâng cao bằng số
        </summary>
        <div className="space-y-6 border-t p-4">
          <AdvancedTextSection
            title="Họ và tên"
            box={config.fullName}
            onChange={(field, value) =>
              updateTextBox("fullName", { [field]: value })
            }
          />
          <AdvancedTextSection
            title="Mã số sinh viên"
            box={config.studentCode}
            onChange={(field, value) =>
              updateTextBox("studentCode", { [field]: value })
            }
          />
          {config.verificationCode ? (
            <AdvancedTextSection
              title="Mã xác minh"
              box={config.verificationCode}
              onChange={(field, value) =>
                updateTextBox("verificationCode", { [field]: value })
              }
            />
          ) : null}
          {config.qrCode ? (
            <fieldset className="space-y-3 border-t pt-4">
              <legend className="text-sm font-semibold">Mã QR</legend>
              <div className="grid grid-cols-3 gap-3">
                <NumberField
                  label="x"
                  value={config.qrCode.x}
                  onChange={(v) => updateQr({ x: v })}
                />
                <NumberField
                  label="y"
                  value={config.qrCode.y}
                  onChange={(v) => updateQr({ y: v })}
                />
                <NumberField
                  label="Kích thước"
                  value={config.qrCode.size}
                  onChange={(v) => updateQr({ size: v })}
                />
              </div>
            </fieldset>
          ) : null}
        </div>
      </details>
    </div>
  );
}

function TextOverlay({
  field,
  label,
  value,
  box,
  scale,
  active,
  onSelect,
  onPointerStart,
}: {
  field: TextFieldKey;
  label: string;
  value: string;
  box: TextBox;
  scale: number;
  active: boolean;
  onSelect: (field: ActiveField) => void;
  onPointerStart: (interaction: Interaction) => void;
}) {
  const fontSize = Math.max(10, Math.round((box.fontSize ?? 32) * scale));
  const displayValue = applyTextTransform(value, box.textTransform);
  const displayLines =
    box.wrapMode === "wrap_long" &&
    shouldWrapByWordCount(displayValue, box.wrapWordThreshold)
      ? splitBalancedLines(displayValue)
      : [displayValue];
  const justifyContent =
    box.align === "left"
      ? "flex-start"
      : box.align === "right"
        ? "flex-end"
        : "center";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Chỉnh vùng ${label}`}
      className={[
        "absolute touch-none rounded border-2 bg-white/20",
        active
          ? "border-pdp-orange shadow-[0_0_0_2px_rgba(255,109,31,0.18)]"
          : "border-sky-500/80",
      ].join(" ")}
      style={{
        left: box.x * scale,
        top: box.y * scale,
        width: box.width * scale,
        height: box.height * scale,
      }}
      onPointerDown={(event) => {
        event.preventDefault();
        onSelect(field);
        onPointerStart({
          kind: "move",
          field,
          startX: event.clientX,
          startY: event.clientY,
          startBox: { ...box },
        });
      }}
    >
      <span className="bg-pdp-orange absolute -top-6 left-0 rounded px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-white">
        {label} · {alignLabel(box.align)}
      </span>
      <div
        className="flex h-full w-full items-center overflow-hidden"
        style={{
          color: box.color,
          fontSize,
          fontWeight: box.fontWeight,
          justifyContent,
          lineHeight: box.lineHeight,
          textAlign: box.align,
        }}
      >
        <span className="max-w-full break-words whitespace-pre-line">
          {displayLines.join("\n")}
        </span>
      </div>
      <ResizeHandle
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onSelect(field);
          onPointerStart({
            kind: "resize",
            field,
            startX: event.clientX,
            startY: event.clientY,
            startBox: { ...box },
          });
        }}
      />
    </div>
  );
}

function QrOverlay({
  box,
  scale,
  active,
  onSelect,
  onPointerStart,
}: {
  box: NonNullable<TemplateConfig["qrCode"]>;
  scale: number;
  active: boolean;
  onSelect: (field: ActiveField) => void;
  onPointerStart: (interaction: Interaction) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Chỉnh vùng QR"
      className={[
        "absolute flex touch-none items-center justify-center rounded border-2 bg-white/35",
        active
          ? "border-pdp-orange shadow-[0_0_0_2px_rgba(255,109,31,0.18)]"
          : "border-emerald-500/80",
      ].join(" ")}
      style={{
        left: box.x * scale,
        top: box.y * scale,
        width: box.size * scale,
        height: box.size * scale,
      }}
      onPointerDown={(event) => {
        event.preventDefault();
        onSelect("qrCode");
        onPointerStart({
          kind: "move",
          field: "qrCode",
          startX: event.clientX,
          startY: event.clientY,
          startBox: { ...box },
        });
      }}
    >
      <span className="bg-pdp-orange absolute -top-6 left-0 rounded px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-white">
        QR
      </span>
      <ScanQrCodeIcon className="text-emerald-700" aria-hidden />
      <ResizeHandle
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onSelect("qrCode");
          onPointerStart({
            kind: "resize",
            field: "qrCode",
            startX: event.clientX,
            startY: event.clientY,
            startBox: { ...box },
          });
        }}
      />
    </div>
  );
}

function ResizeHandle({
  onPointerDown,
}: {
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      aria-label="Đổi kích thước"
      className="bg-pdp-orange absolute right-0 bottom-0 size-4 translate-x-1/2 translate-y-1/2 cursor-se-resize rounded-full border-2 border-white"
      onPointerDown={onPointerDown}
    />
  );
}

function ResizeProbe({ onResize }: { onResize: (width: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    onResize(node.clientWidth);
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) onResize(width);
    });
    observer.observe(node);

    return () => observer.disconnect();
  }, [onResize]);

  return (
    <div
      className="pointer-events-none absolute inset-0"
      ref={ref}
    />
  );
}

function AdvancedTextSection({
  title,
  box,
  onChange,
}: {
  title: string;
  box: TextBox;
  onChange: (field: keyof TextBox, value: number | string) => void;
}) {
  return (
    <fieldset className="space-y-3 border-t pt-4 first:border-t-0 first:pt-0">
      <legend className="text-sm font-semibold">{title}</legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <NumberField label="x" value={box.x} onChange={(v) => onChange("x", v)} />
        <NumberField label="y" value={box.y} onChange={(v) => onChange("y", v)} />
        <NumberField
          label="Rộng"
          value={box.width}
          onChange={(v) => onChange("width", v)}
        />
        <NumberField
          label="Cao"
          value={box.height}
          onChange={(v) => onChange("height", v)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <NumberField
          label="Cỡ chữ tối đa"
          value={box.fontSize ?? 0}
          onChange={(v) => onChange("fontSize", v)}
        />
        <NumberField
          label="Cỡ chữ tối thiểu"
          value={box.minFontSize ?? 0}
          onChange={(v) => onChange("minFontSize", v)}
        />
        <div className="space-y-1.5">
          <Label className="text-xs">Màu</Label>
          <Input
            type="color"
            value={box.color ?? "#000000"}
            onChange={(e) => onChange("color", e.target.value)}
            className="h-10 w-full p-1"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Căn lề</Label>
          <select
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            value={box.align ?? "center"}
            onChange={(e) => onChange("align", e.target.value)}
          >
            <option value="left">Trái</option>
            <option value="center">Giữa</option>
            <option value="right">Phải</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Kiểu hiển thị</Label>
          <select
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            value={box.textTransform ?? "none"}
            onChange={(e) => onChange("textTransform", e.target.value)}
          >
            <option value="none">Giữ nguyên như Excel</option>
            <option value="uppercase">IN HOA</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Độ đậm</Label>
          <select
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            value={box.fontWeight ?? "700"}
            onChange={(e) => onChange("fontWeight", e.target.value)}
          >
            <option value="400">Thường</option>
            <option value="500">Vừa nhẹ</option>
            <option value="600">Bán đậm</option>
            <option value="700">Đậm</option>
            <option value="800">Rất đậm</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Tên dài</Label>
          <select
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            value={box.wrapMode ?? "shrink"}
            onChange={(e) => onChange("wrapMode", e.target.value)}
          >
            <option value="shrink">Co để giữ một dòng</option>
            <option value="wrap_long">Xuống dòng khi dài hơn ngưỡng</option>
          </select>
        </div>
        <NumberField
          label="Ngưỡng xuống dòng (số chữ)"
          value={box.wrapWordThreshold ?? 4}
          onChange={(v) => onChange("wrapWordThreshold", v)}
        />
      </div>
    </fieldset>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="h-10"
      />
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function horizontalPosition(
  position: "left" | "center" | "right",
  containerWidth: number,
  itemWidth: number,
): number {
  switch (position) {
    case "left":
      return 0;
    case "right":
      return Math.max(0, containerWidth - itemWidth);
    default:
      return Math.round((containerWidth - itemWidth) / 2);
  }
}

function alignLabel(align: TextBox["align"]): string {
  switch (align) {
    case "left":
      return "trái";
    case "right":
      return "phải";
    default:
      return "giữa";
  }
}

function textTransformLabel(
  transform: TextBox["textTransform"] | undefined,
): string {
  return transform === "uppercase" ? "IN HOA" : "giữ nguyên";
}

function wrapModeLabel(wrapMode: TextBox["wrapMode"] | undefined): string {
  return wrapMode === "wrap_long" ? "xuống dòng" : "co 1 dòng";
}
