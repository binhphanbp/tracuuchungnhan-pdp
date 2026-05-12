"use client";

import Image from "next/image";
import { ImageIcon, RefreshCcwIcon, UploadCloudIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type TemplateMeta = {
  dataUrl: string;
  width: number;
  height: number;
  fileName: string;
};

export function TemplateUploader({
  template,
  onUpload,
  onClear,
}: {
  template: TemplateMeta | null;
  onUpload: (file: File) => void;
  onClear: () => void;
}) {
  if (template) {
    return (
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 py-4">
          <div className="bg-muted relative size-20 overflow-hidden rounded">
            <Image
              src={template.dataUrl}
              alt="Template"
              fill
              className="object-contain"
              unoptimized
              sizes="80px"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{template.fileName}</p>
            <p className="text-muted-foreground text-sm">
              {template.width.toLocaleString("vi-VN")} ×{" "}
              {template.height.toLocaleString("vi-VN")} px
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onClear}>
            <RefreshCcwIcon aria-hidden />
            Đổi template
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <label
          htmlFor="template-file"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) onUpload(file);
          }}
          className="border-border/70 hover:border-pdp-orange/60 hover:bg-pdp-orange/5 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors"
        >
          <UploadCloudIcon
            className="text-muted-foreground size-10"
            aria-hidden
          />
          <div>
            <p className="font-medium">Kéo & thả ảnh template (.png) vào đây</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Nên là file PNG xuất từ Canva/Illustrator, đã xoá phần text
              placeholder. Khuyên dùng độ phân giải cao (≥ 3000 px chiều rộng).
            </p>
          </div>
          <span className="text-pdp-orange inline-flex items-center gap-1 text-xs font-medium">
            <ImageIcon className="size-3.5" aria-hidden /> Chọn từ máy
          </span>
          <input
            id="template-file"
            type="file"
            accept="image/png,image/jpeg"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.target.value = "";
            }}
          />
        </label>
      </CardContent>
    </Card>
  );
}
