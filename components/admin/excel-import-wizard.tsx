"use client";

import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  FileSpreadsheetIcon,
  Loader2Icon,
  RefreshCcwIcon,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type CanonicalField, CANONICAL_FIELDS } from "@/lib/excel/columns";
import { parseSheet, type ParsedSheet } from "@/lib/excel/parse";
import {
  type ValidationReport,
  validateRows,
} from "@/lib/validation/student-row";

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

export function ExcelImportWizard() {
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedSheet | null>(null);
  const [mapping, setMapping] = useState<Mapping>({});
  const [report, setReport] = useState<ValidationReport | null>(null);

  const reset = useCallback(() => {
    setParsed(null);
    setMapping({});
    setReport(null);
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setParsing(true);
    setReport(null);
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
      const message =
        err instanceof Error ? err.message : "Không thể đọc file.";
      toast.error(message);
    } finally {
      setParsing(false);
    }
  }, []);

  const missingRequired = useMemo(
    () => REQUIRED_FIELDS.filter((f) => !mapping[f]),
    [mapping],
  );

  const runValidation = useCallback(() => {
    if (!parsed) return;
    if (missingRequired.length > 0) {
      toast.error(
        `Thiếu ánh xạ cho cột bắt buộc: ${missingRequired.map((f) => FIELD_LABELS[f]).join(", ")}.`,
      );
      return;
    }
    const remapped = parsed.rows.map((row) => {
      const out: Record<string, unknown> = {};
      for (const [canonical, header] of Object.entries(mapping)) {
        if (header) out[canonical] = row[header];
      }
      return out;
    });
    const result = validateRows(remapped);
    setReport(result);
  }, [parsed, mapping, missingRequired]);

  return (
    <div className="space-y-6">
      {!parsed ? (
        <FileDropzone onFile={handleFile} parsing={parsing} />
      ) : (
        <>
          <FileSummary parsed={parsed} onReset={reset} />
          <ColumnMappingTable
            parsed={parsed}
            mapping={mapping}
            setMapping={setMapping}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted-foreground text-sm">
              {missingRequired.length > 0 ? (
                <>
                  <AlertTriangleIcon
                    className="mr-1 inline-block size-4 text-amber-600"
                    aria-hidden
                  />
                  Vui lòng ánh xạ các cột bắt buộc:{" "}
                  <span className="font-medium">
                    {missingRequired
                      .map((f) => FIELD_LABELS[f].replace(" (bắt buộc)", ""))
                      .join(", ")}
                  </span>
                  .
                </>
              ) : (
                <>Đã sẵn sàng kiểm tra dữ liệu.</>
              )}
            </p>
            <Button
              onClick={runValidation}
              disabled={missingRequired.length > 0}
              className="bg-pdp-orange hover:bg-pdp-orange/90 text-white"
            >
              Kiểm tra dữ liệu
            </Button>
          </div>

          {report ? <ValidationResult report={report} /> : null}
        </>
      )}
    </div>
  );
}

function FileDropzone({
  onFile,
  parsing,
}: {
  onFile: (f: File) => void;
  parsing: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <label
          htmlFor="excel-file"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) onFile(file);
          }}
          className="border-border/70 hover:border-pdp-orange/60 hover:bg-pdp-orange/5 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors"
        >
          {parsing ? (
            <Loader2Icon
              className="text-pdp-orange size-10 animate-spin"
              aria-hidden
            />
          ) : (
            <UploadCloudIcon
              className="text-muted-foreground size-10"
              aria-hidden
            />
          )}
          <div>
            <p className="font-medium">
              {parsing ? "Đang đọc file..." : "Kéo & thả file Excel vào đây"}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              Chấp nhận .xlsx, .xls, .csv — xử lý hoàn toàn trên trình duyệt của
              bạn.
            </p>
          </div>
          <input
            id="excel-file"
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
      </CardContent>
    </Card>
  );
}

function FileSummary({
  parsed,
  onReset,
}: {
  parsed: ParsedSheet;
  onReset: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-3">
          <FileSpreadsheetIcon className="text-pdp-orange size-5" aria-hidden />
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
        <Button variant="outline" size="sm" onClick={onReset}>
          <RefreshCcwIcon aria-hidden />
          Chọn file khác
        </Button>
      </CardContent>
    </Card>
  );
}

function ColumnMappingTable({
  parsed,
  mapping,
  setMapping,
}: {
  parsed: ParsedSheet;
  mapping: Mapping;
  setMapping: (next: Mapping) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">Ánh xạ cột</h2>
        <p className="text-muted-foreground text-sm">
          Chọn cột tương ứng trong file Excel cho từng trường dữ liệu. Các
          trường không bắt buộc có thể để trống.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {CANONICAL_FIELDS.map((field) => (
          <div
            key={field}
            className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[200px_1fr]"
          >
            <Label htmlFor={`map-${field}`}>{FIELD_LABELS[field]}</Label>
            <Select
              value={mapping[field] ?? NONE_VALUE}
              onValueChange={(value) =>
                setMapping({
                  ...mapping,
                  [field]: value === NONE_VALUE ? undefined : value,
                })
              }
            >
              <SelectTrigger id={`map-${field}`} className="w-full">
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
      </CardContent>
    </Card>
  );
}

function ValidationResult({ report }: { report: ValidationReport }) {
  const validCount = report.validRows.length;
  const errorRows = new Set(report.errors.map((e) => e.rowNumber));
  const errorCount = errorRows.size;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-4">
          <h2 className="font-semibold">Kết quả kiểm tra</h2>
          <div className="flex items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 text-emerald-700">
              <CheckCircle2Icon className="size-4" aria-hidden />
              {validCount.toLocaleString("vi-VN")} hợp lệ
            </span>
            {errorCount > 0 ? (
              <span className="text-destructive inline-flex items-center gap-1.5">
                <AlertTriangleIcon className="size-4" aria-hidden />
                {errorCount.toLocaleString("vi-VN")} lỗi
              </span>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={errorCount > 0 ? "errors" : "valid"}>
          <TabsList>
            <TabsTrigger value="valid">
              Hợp lệ ({validCount.toLocaleString("vi-VN")})
            </TabsTrigger>
            <TabsTrigger value="errors">
              Lỗi ({errorCount.toLocaleString("vi-VN")})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="valid" className="mt-4">
            <ValidRowsTable rows={report.validRows.slice(0, 200)} />
            {report.validRows.length > 200 ? (
              <p className="text-muted-foreground mt-2 text-center text-xs">
                Hiển thị 200 dòng đầu tiên — toàn bộ{" "}
                {report.validRows.length.toLocaleString("vi-VN")} dòng đã được
                ghi nhận.
              </p>
            ) : null}
          </TabsContent>
          <TabsContent value="errors" className="mt-4">
            <ErrorsTable errors={report.errors} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ValidRowsTable({
  rows,
}: {
  rows: {
    rowNumber: number;
    data: import("@/lib/validation/student-row").StudentRow;
  }[];
}) {
  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        Chưa có dòng hợp lệ.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>MSSV</TableHead>
            <TableHead>Họ và tên</TableHead>
            <TableHead>Lớp</TableHead>
            <TableHead>Email</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ rowNumber, data }) => (
            <TableRow key={rowNumber}>
              <TableCell className="text-muted-foreground text-xs">
                {rowNumber}
              </TableCell>
              <TableCell className="font-mono">{data.student_code}</TableCell>
              <TableCell>{data.full_name}</TableCell>
              <TableCell>{data.class_name ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">
                {data.email ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ErrorsTable({
  errors,
}: {
  errors: import("@/lib/validation/student-row").RowError[];
}) {
  if (errors.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        Không có lỗi.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Dòng</TableHead>
            <TableHead className="w-40">Trường</TableHead>
            <TableHead>Mô tả</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {errors.map((e, idx) => (
            <TableRow key={idx}>
              <TableCell className="font-mono">{e.rowNumber}</TableCell>
              <TableCell className="text-muted-foreground font-mono text-xs">
                {e.field}
              </TableCell>
              <TableCell className="text-destructive">{e.message}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
