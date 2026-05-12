"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  DownloadIcon,
  FileSpreadsheetIcon,
  Loader2Icon,
  PlayIcon,
  RefreshCcwIcon,
  SaveIcon,
  UploadCloudIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TemplateUploader,
  type TemplateMeta,
} from "@/components/admin/template-uploader";
import { PositionConfigForm } from "@/components/admin/position-config-form";
import { CertificatePreview } from "@/components/admin/certificate-preview";
import { type CanonicalField, CANONICAL_FIELDS } from "@/lib/excel/columns";
import { parseSheet, type ParsedSheet } from "@/lib/excel/parse";
import {
  loadImageElement,
  fileToDataUrl,
  renderCertificate,
} from "@/lib/generator/render";
import {
  createTemplateConfigForImage,
  type TemplateConfig,
} from "@/lib/generator/template-config";
import {
  newVerificationCode,
  verificationUrlFor,
} from "@/lib/generator/verification-code";
import {
  buildCertificateZip,
  buildFilename,
  downloadBlob,
  type GeneratedCertificate,
} from "@/lib/generator/zip";
import {
  type StudentRow,
  type ValidationReport,
  validateRows,
} from "@/lib/validation/student-row";
import {
  saveCertificateBatch,
  saveDriveLinksForCertificates,
  saveTemplateConfig,
  type DriveLinkUpdate,
} from "@/app/admin/campaigns/[campaignId]/generator/actions";
import type { CertificateRecord } from "@/lib/validation/certificate-record";
import {
  DriveUploadPanel,
  type DriveUploadConfig,
} from "@/components/admin/drive-upload-panel";

const FIELD_LABELS: Record<CanonicalField, string> = {
  student_code: "MSSV (bắt buộc)",
  full_name: "Họ và tên (bắt buộc)",
  class_name: "Lớp",
  email: "Email",
  date_of_birth: "Ngày sinh",
  certificate_title: "Tên chứng nhận",
  issue_date: "Ngày cấp",
};

const REQUIRED_FIELDS: CanonicalField[] = ["student_code", "full_name"];

const NONE_VALUE = "__none__";

type Mapping = Partial<Record<CanonicalField, string>>;

export function GeneratorWizard({
  campaignId,
  campaignTitle,
  campaignSlug,
  initialConfig,
}: {
  campaignId: string;
  campaignTitle: string;
  campaignSlug: string;
  initialConfig: TemplateConfig;
}) {
  const [template, setTemplate] = useState<TemplateMeta | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedSheet | null>(null);
  const [mapping, setMapping] = useState<Mapping>({});
  const [config, setConfig] = useState<TemplateConfig>(initialConfig);
  const [savingConfig, startSavingConfig] = useTransition();

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const cancelRef = useRef(false);

  // Last successful batch — kept around so the admin can choose to upload
  // to Drive after the fact, even if they generated without being signed in
  // to Google.
  const [lastBatch, setLastBatch] = useState<GeneratedCertificate[]>([]);

  // M10: Drive direct-upload state.
  const [driveConfig, setDriveConfig] = useState<DriveUploadConfig>({
    auth: { kind: "signed_out" },
    folderId: null,
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    done: number;
    total: number;
    failed: number;
  } | null>(null);

  /* ---------- Template upload ---------- */

  const handleTemplate = useCallback(async (file: File) => {
    try {
      const dataUrl = await fileToDataUrl(file);
      const img = await loadImageElement(dataUrl);
      setTemplate({
        dataUrl,
        width: img.naturalWidth,
        height: img.naturalHeight,
        fileName: file.name,
      });
      setConfig((current) => {
        const matchesCurrentTemplate =
          current.templateWidth === img.naturalWidth &&
          current.templateHeight === img.naturalHeight;

        return matchesCurrentTemplate
          ? current
          : createTemplateConfigForImage(img.naturalWidth, img.naturalHeight);
      });
      toast.success(
        `Đã nạp template ${img.naturalWidth} × ${img.naturalHeight}.`,
      );
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Không thể nạp file template.",
      );
    }
  }, []);

  /* ---------- Excel upload ---------- */

  const handleExcel = useCallback(async (file: File) => {
    setParsing(true);
    try {
      const result = await parseSheet(file);
      setParsed(result);
      setMapping(result.detectedMapping);
      if (result.rows.length === 0) {
        toast.error("File không có dòng dữ liệu nào.");
      } else {
        toast.success(
          `Đã đọc ${result.rows.length.toLocaleString("vi-VN")} dòng từ "${result.sheetName}".`,
        );
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể đọc file Excel.",
      );
    } finally {
      setParsing(false);
    }
  }, []);

  const missingRequired = useMemo(
    () => REQUIRED_FIELDS.filter((f) => !mapping[f]),
    [mapping],
  );

  // Validation is a pure derivation from `parsed` + `mapping` — compute it
  // via useMemo instead of effect-driven state to avoid cascading renders.
  const report: ValidationReport | null = useMemo(() => {
    if (!parsed || missingRequired.length > 0) return null;
    const remapped = parsed.rows.map((row) => {
      const out: Record<string, unknown> = {};
      for (const [canonical, header] of Object.entries(mapping)) {
        if (header) out[canonical] = row[header];
      }
      return out;
    });
    return validateRows(remapped);
  }, [parsed, mapping, missingRequired]);

  /* ---------- Save config ---------- */

  const onSaveConfig = () => {
    startSavingConfig(async () => {
      const res = await saveTemplateConfig(campaignId, config);
      if (res.ok) {
        toast.success("Đã lưu cấu hình vị trí.");
      } else {
        toast.error(res.error);
      }
    });
  };

  /* ---------- Batch generation ---------- */

  const previewRow = report?.validRows[0]?.data;

  const validCount = report?.validRows.length ?? 0;

  const canGenerate = !!template && !!report && validCount > 0 && !generating;

  const generateAll = async () => {
    if (!template || !report || validCount === 0) return;
    setGenerating(true);
    cancelRef.current = false;
    setProgress({ done: 0, total: validCount });

    try {
      const img = await loadImageElement(template.dataUrl);
      const issueDateForFilename = new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "");

      const certificates: GeneratedCertificate[] = [];

      for (let i = 0; i < report.validRows.length; i++) {
        if (cancelRef.current) {
          toast.info("Đã huỷ sinh chứng nhận.");
          break;
        }
        const { data } = report.validRows[i];
        const code = newVerificationCode();
        const payload = verificationUrlFor(code);

        const result = await renderCertificate({
          template: img,
          config,
          data: {
            full_name: data.full_name,
            student_code: data.student_code,
            verification_code: code,
            qr_payload: payload,
          },
        });

        const blob = await canvasToBlob(result.canvas);
        certificates.push({
          filename: buildFilename(data.student_code, data.full_name, {
            suffix: campaignSlug.toUpperCase().replace(/-/g, "_").slice(0, 30),
            date: issueDateForFilename,
          }),
          blob,
          student_code: data.student_code,
          full_name: data.full_name,
          class_name: data.class_name ?? null,
          verification_code: code,
          qr_payload: payload,
          warnings: result.warnings,
        });

        setProgress({ done: i + 1, total: validCount });

        // Yield to the event loop every 5 rows so the UI stays responsive.
        if (i % 5 === 4) {
          await new Promise((r) => setTimeout(r, 0));
        }
      }

      if (cancelRef.current || certificates.length === 0) return;

      toast.success(
        `Đã sinh ${certificates.length.toLocaleString("vi-VN")} chứng nhận. Đang đóng gói ZIP...`,
      );
      const zip = await buildCertificateZip(certificates);
      const issueDateIso = new Date().toISOString().slice(0, 10);
      downloadBlob(zip, `${campaignSlug}-certificates.zip`);
      toast.success("Đã tải xuống ZIP.");

      // Stash the batch so the M10 panel can offer Drive upload afterwards.
      setLastBatch(certificates);
      setUploadProgress(null);

      // Persist metadata to Supabase so admins can search/publish later.
      const records: CertificateRecord[] = certificates.map((c) => ({
        student_code: c.student_code,
        full_name: c.full_name,
        class_name: c.class_name ?? null,
        issue_date: issueDateIso,
        file_name: c.filename,
        verification_code: c.verification_code,
        qr_payload: c.qr_payload,
        warnings: c.warnings,
      }));
      const saveResult = await saveCertificateBatch(campaignId, records);
      if (saveResult.ok) {
        toast.success(
          `Đã lưu ${saveResult.saved.toLocaleString("vi-VN")} chứng nhận vào cơ sở dữ liệu.`,
        );
      } else {
        toast.error(`Không lưu được metadata: ${saveResult.error}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi khi sinh chứng nhận.");
    } finally {
      setGenerating(false);
    }
  };

  const cancelGeneration = () => {
    cancelRef.current = true;
  };

  /* ---------- M10: Drive upload ---------- */

  const uploadBatchToDrive = async () => {
    if (driveConfig.auth.kind !== "signed_in") {
      toast.error("Hãy đăng nhập Google trước khi upload.");
      return;
    }
    if (lastBatch.length === 0) {
      toast.info("Chưa có chứng nhận nào trong bộ nhớ để upload.");
      return;
    }

    setUploading(true);
    setUploadProgress({ done: 0, total: lastBatch.length, failed: 0 });

    // Lazy-import to keep the GIS-dependent code out of the initial bundle.
    const { uploadFileToDrive, makeDriveFilePublic } =
      await import("@/lib/google-drive/upload");

    const accessToken = driveConfig.auth.accessToken;
    const folderId = driveConfig.folderId ?? undefined;

    const successUpdates: DriveLinkUpdate[] = [];
    let failed = 0;

    for (let i = 0; i < lastBatch.length; i++) {
      const cert = lastBatch[i];
      try {
        const result = await uploadFileToDrive(
          accessToken,
          cert.blob,
          cert.filename,
          folderId,
        );
        // Best-effort public share — if it fails (rare; usually a folder
        // permission conflict), continue but log a warning.
        try {
          await makeDriveFilePublic(accessToken, result.fileId);
        } catch (permErr) {
          console.warn("makeDriveFilePublic failed", permErr);
        }
        successUpdates.push({
          student_code: cert.student_code,
          drive_file_id: result.fileId,
          drive_view_url: result.viewUrl,
          drive_download_url: result.downloadUrl,
        });
      } catch (e) {
        failed += 1;
        console.error("Drive upload failed for", cert.filename, e);
      }
      setUploadProgress({
        done: i + 1,
        total: lastBatch.length,
        failed,
      });
      // Yield to the event loop every few uploads.
      if (i % 3 === 2) {
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    // Persist successful uploads' Drive links back to Supabase.
    if (successUpdates.length > 0) {
      const res = await saveDriveLinksForCertificates(
        campaignId,
        successUpdates,
      );
      if (res.ok) {
        toast.success(
          `Upload xong: ${successUpdates.length.toLocaleString("vi-VN")} thành công${
            failed > 0 ? `, ${failed} lỗi` : ""
          }. Đã gắn link Drive vào cơ sở dữ liệu.`,
        );
      } else {
        toast.error(`Upload xong nhưng không lưu được link: ${res.error}`);
      }
    } else {
      toast.error("Không upload được file nào.");
    }

    setUploading(false);
  };

  /* ---------- Render ---------- */

  return (
    <div className="space-y-6">
      <SectionCard
        title="1. Tải template"
        subtitle="Ảnh nền chứng nhận đã xoá text placeholder."
      >
        <TemplateUploader
          template={template}
          onUpload={handleTemplate}
          onClear={() => setTemplate(null)}
        />
      </SectionCard>

      <SectionCard
        title="2. Tải danh sách Excel"
        subtitle={`Cho chiến dịch "${campaignTitle}". Hệ thống sẽ tự nhận diện cột.`}
      >
        {!parsed ? (
          <ExcelDropzone onFile={handleExcel} parsing={parsing} />
        ) : (
          <div className="space-y-4">
            <Card>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="flex items-center gap-3">
                  <FileSpreadsheetIcon
                    className="text-pdp-orange size-5"
                    aria-hidden
                  />
                  <div>
                    <p className="font-medium">
                      Sheet &ldquo;{parsed.sheetName}&rdquo;
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {parsed.rows.length.toLocaleString("vi-VN")} dòng ·{" "}
                      {parsed.headers.length} cột
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setParsed(null);
                    setMapping({});
                  }}
                >
                  <RefreshCcwIcon aria-hidden />
                  Đổi file
                </Button>
              </CardContent>
            </Card>

            <ColumnMappingTable
              parsed={parsed}
              mapping={mapping}
              setMapping={setMapping}
            />

            {missingRequired.length > 0 ? (
              <p className="text-sm text-amber-700">
                <AlertTriangleIcon
                  className="mr-1 inline-block size-4"
                  aria-hidden
                />
                Vui lòng ánh xạ:{" "}
                <span className="font-medium">
                  {missingRequired
                    .map((f) => FIELD_LABELS[f].replace(" (bắt buộc)", ""))
                    .join(", ")}
                </span>
              </p>
            ) : report ? (
              <div className="flex items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2Icon className="size-4" aria-hidden />
                  {report.validRows.length.toLocaleString("vi-VN")} hợp lệ
                </span>
                {report.errors.length > 0 ? (
                  <span className="text-destructive inline-flex items-center gap-1.5">
                    <AlertTriangleIcon className="size-4" aria-hidden />
                    {report.errors.length.toLocaleString("vi-VN")} lỗi
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="3. Cấu hình vị trí"
        subtitle="Kéo thả trực tiếp trên template để đặt tên, MSSV, mã xác minh và QR."
      >
        <PositionConfigForm
          config={config}
          onChange={setConfig}
          template={template}
          sample={previewRow}
        />
        <div className="mt-4 flex justify-end">
          <Button
            onClick={onSaveConfig}
            disabled={savingConfig}
            variant="outline"
          >
            {savingConfig ? (
              <Loader2Icon className="animate-spin" aria-hidden />
            ) : (
              <SaveIcon aria-hidden />
            )}
            Lưu cấu hình
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title="4. Xem trước"
        subtitle="Sử dụng dòng hợp lệ đầu tiên trong file Excel."
      >
        {!template ? (
          <EmptyHint>Chưa có template.</EmptyHint>
        ) : !previewRow ? (
          <EmptyHint>
            Tải Excel và ánh xạ cột bắt buộc để xem trước với dòng đầu tiên.
          </EmptyHint>
        ) : (
          <CertificatePreview
            templateDataUrl={template.dataUrl}
            row={previewRow as StudentRow}
            config={config}
          />
        )}
      </SectionCard>

      <SectionCard
        title="5. Sinh chứng nhận hàng loạt"
        subtitle="Sinh PNG cho toàn bộ dòng hợp lệ và đóng gói ZIP."
      >
        <BatchPanel
          canGenerate={canGenerate}
          generating={generating}
          progress={progress}
          validCount={validCount}
          onStart={generateAll}
          onCancel={cancelGeneration}
        />
      </SectionCard>

      <SectionCard
        title="6. Tải lên Google Drive (tự động)"
        subtitle="Đăng nhập Google và chọn folder để upload thẳng PNG đến Drive mà không cần manifest thủ công."
      >
        <DriveUploadPanel
          config={driveConfig}
          onConfigChange={setDriveConfig}
          totalToUpload={lastBatch.length}
          uploadProgress={uploadProgress}
          uploading={uploading}
          onStartUpload={uploadBatchToDrive}
        />
      </SectionCard>
    </div>
  );
}

/* ---------- Helpers ---------- */

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Không thể xuất PNG."))),
      "image/png",
    );
  });
}

/* ---------- Subcomponents ---------- */

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">{title}</h2>
        {subtitle ? (
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        ) : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground py-6 text-center text-sm">{children}</p>
  );
}

function ExcelDropzone({
  onFile,
  parsing,
}: {
  onFile: (f: File) => void;
  parsing: boolean;
}) {
  return (
    <label
      htmlFor="generator-excel"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      className="border-border/70 hover:border-pdp-orange/60 hover:bg-pdp-orange/5 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors"
    >
      {parsing ? (
        <Loader2Icon
          className="text-pdp-orange size-8 animate-spin"
          aria-hidden
        />
      ) : (
        <UploadCloudIcon className="text-muted-foreground size-8" aria-hidden />
      )}
      <p className="font-medium">
        {parsing ? "Đang đọc file..." : "Kéo & thả file Excel"}
      </p>
      <p className="text-muted-foreground text-sm">.xlsx, .xls, .csv</p>
      <input
        id="generator-excel"
        type="file"
        accept=".xlsx,.xls,.csv"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </label>
  );
}

function ColumnMappingTable({
  parsed,
  mapping,
  setMapping,
}: {
  parsed: ParsedSheet;
  mapping: Mapping;
  setMapping: (m: Mapping) => void;
}) {
  return (
    <div className="space-y-2">
      {CANONICAL_FIELDS.map((field) => (
        <div
          key={field}
          className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[200px_1fr]"
        >
          <Label htmlFor={`gen-map-${field}`}>{FIELD_LABELS[field]}</Label>
          <Select
            value={mapping[field] ?? NONE_VALUE}
            onValueChange={(value) =>
              setMapping({
                ...mapping,
                [field]: value === NONE_VALUE ? undefined : value,
              })
            }
          >
            <SelectTrigger id={`gen-map-${field}`} className="w-full">
              <SelectValue placeholder="Không sử dụng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>
                <span className="text-muted-foreground italic">
                  Không sử dụng
                </span>
              </SelectItem>
              {parsed.headers.map((h) => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}

function BatchPanel({
  canGenerate,
  generating,
  progress,
  validCount,
  onStart,
  onCancel,
}: {
  canGenerate: boolean;
  generating: boolean;
  progress: { done: number; total: number };
  validCount: number;
  onStart: () => void;
  onCancel: () => void;
}) {
  const pct =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="space-y-4">
      <p className="text-sm">
        Sẵn sàng sinh{" "}
        <span className="font-medium">
          {validCount.toLocaleString("vi-VN")}
        </span>{" "}
        chứng nhận từ các dòng hợp lệ. Quá trình chạy hoàn toàn trên trình duyệt
        — không tải dữ liệu lên máy chủ.
      </p>

      {generating ? (
        <div className="space-y-2">
          <div className="bg-muted relative h-3 overflow-hidden rounded-full">
            <div
              className="bg-pdp-orange absolute inset-y-0 left-0 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-muted-foreground text-sm">
            {progress.done.toLocaleString("vi-VN")} /{" "}
            {progress.total.toLocaleString("vi-VN")} ({pct}%)
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {generating ? (
          <Button variant="outline" onClick={onCancel}>
            Huỷ
          </Button>
        ) : (
          <Button
            onClick={onStart}
            disabled={!canGenerate}
            className="bg-pdp-orange hover:bg-pdp-orange/90 text-white"
          >
            <PlayIcon aria-hidden />
            Sinh tất cả
          </Button>
        )}
        {!generating &&
        progress.done > 0 &&
        progress.done === progress.total ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700">
            <DownloadIcon className="size-4" aria-hidden />
            Đã hoàn tất — kiểm tra thư mục Downloads.
          </span>
        ) : null}
      </div>
    </div>
  );
}
