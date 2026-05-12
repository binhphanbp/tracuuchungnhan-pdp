"use client";

import { useEffect, useState } from "react";
import { AlertTriangleIcon, Loader2Icon } from "lucide-react";

import {
  fileToDataUrl,
  loadImageElement,
  renderCertificate,
} from "@/lib/generator/render";
import {
  newVerificationCode,
  verificationUrlFor,
} from "@/lib/generator/verification-code";
import type { TemplateConfig } from "@/lib/generator/template-config";
import type { StudentRow } from "@/lib/validation/student-row";

export type PreviewRow = {
  full_name: string;
  student_code: string;
};

/**
 * Render the first valid row onto the uploaded template, scaling the
 * resulting canvas to fit the parent container. Re-renders whenever the
 * template, row data, or position config changes.
 */
export function CertificatePreview({
  templateDataUrl,
  row,
  config,
}: {
  templateDataUrl: string;
  row: PreviewRow | StudentRow;
  config: TemplateConfig;
}) {
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setBusy(true);
      setError(null);
      setPreviewUrl(null);
      try {
        const template = await loadImageElement(templateDataUrl);
        const code = newVerificationCode();
        const result = await renderCertificate({
          template,
          config,
          data: {
            full_name: row.full_name,
            student_code: row.student_code,
            verification_code: code,
            qr_payload: verificationUrlFor(code),
          },
        });
        if (cancelled) return;

        setPreviewUrl(result.canvas.toDataURL("image/png"));
        setWarnings(result.warnings);
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof Error ? e.message : "Không thể vẽ bản xem trước.",
        );
      } finally {
        if (!cancelled) setBusy(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [templateDataUrl, row.full_name, row.student_code, config]);

  return (
    <div className="space-y-2">
      <div className="bg-muted relative min-h-[200px] overflow-hidden rounded border">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Bản xem trước chứng nhận"
            className="h-auto w-full rounded border"
          />
        ) : null}
        {busy ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2Icon
              className="text-pdp-orange size-6 animate-spin"
              aria-hidden
            />
          </div>
        ) : null}
      </div>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
      {warnings.length > 0 ? (
        <ul className="text-sm text-amber-700">
          {warnings.map((w, i) => (
            <li key={i} className="inline-flex items-start gap-1">
              <AlertTriangleIcon
                className="mt-0.5 size-4 shrink-0"
                aria-hidden
              />
              {w}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Re-export so the wizard can construct the data URL up front. */
export { fileToDataUrl };
