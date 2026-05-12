"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2Icon, SaveIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toSlug } from "@/lib/utils/slug";
import type { CampaignStatus } from "@/lib/validation/campaign";

export type CampaignFormState = {
  formError: string | null;
  fieldErrors: Partial<
    Record<
      | "title"
      | "slug"
      | "description"
      | "issue_date"
      | "signer_name"
      | "signer_title"
      | "drive_folder_id"
      | "status",
      string
    >
  >;
};

export const initialCampaignFormState: CampaignFormState = {
  formError: null,
  fieldErrors: {},
};

export type CampaignFormDefaults = {
  title?: string;
  slug?: string;
  description?: string | null;
  issue_date?: string;
  signer_name?: string | null;
  signer_title?: string | null;
  drive_folder_id?: string | null;
  status?: CampaignStatus;
};

const STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Nháp",
  published: "Đang phát hành",
  archived: "Đã lưu trữ",
};

export function CampaignForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (
    prev: CampaignFormState,
    formData: FormData,
  ) => Promise<CampaignFormState>;
  defaults?: CampaignFormDefaults;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialCampaignFormState);
  const [title, setTitle] = useState(defaults?.title ?? "");
  const [slug, setSlug] = useState(defaults?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(defaults?.slug));

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="title"
          name="title"
          label="Tên chiến dịch"
          required
          value={title}
          onChange={(value) => {
            setTitle(value);
            if (!slugTouched) setSlug(toSlug(value));
          }}
          error={state.fieldErrors.title}
          placeholder="Chứng nhận PolyPass — Khoá 05/2026"
        />
        <Field
          id="slug"
          name="slug"
          label="Slug"
          required
          value={slug}
          onChange={(value) => {
            setSlug(value);
            setSlugTouched(true);
          }}
          error={state.fieldErrors.slug}
          placeholder="polypass-khoa-05-2026"
          hint="Dùng cho URL nội bộ. Tự sinh từ tên, có thể chỉnh tay."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Mô tả</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaults?.description ?? ""}
          aria-invalid={state.fieldErrors.description ? "true" : "false"}
          aria-describedby={
            state.fieldErrors.description ? "description-error" : undefined
          }
        />
        {state.fieldErrors.description ? (
          <p
            id="description-error"
            className="text-destructive text-sm"
            role="alert"
          >
            {state.fieldErrors.description}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          id="issue_date"
          name="issue_date"
          label="Ngày cấp"
          type="date"
          required
          defaultValue={defaults?.issue_date ?? ""}
          error={state.fieldErrors.issue_date}
        />
        <Field
          id="signer_name"
          name="signer_name"
          label="Người ký"
          defaultValue={defaults?.signer_name ?? ""}
          error={state.fieldErrors.signer_name}
          placeholder="Nguyễn Văn A"
        />
        <Field
          id="signer_title"
          name="signer_title"
          label="Chức vụ người ký"
          defaultValue={defaults?.signer_title ?? ""}
          error={state.fieldErrors.signer_title}
          placeholder="Trưởng phòng PDP"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="drive_folder_id"
          name="drive_folder_id"
          label="Google Drive folder ID"
          defaultValue={defaults?.drive_folder_id ?? ""}
          error={state.fieldErrors.drive_folder_id}
          placeholder="1aBcDeFgHiJ..."
          hint="Lấy từ URL Drive (phần sau /folders/)."
        />
        <div className="space-y-2">
          <Label htmlFor="status">Trạng thái</Label>
          <Select name="status" defaultValue={defaults?.status ?? "draft"}>
            <SelectTrigger id="status" className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_LABELS) as CampaignStatus[]).map((value) => (
                <SelectItem key={value} value={value}>
                  {STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.fieldErrors.status ? (
            <p className="text-destructive text-sm" role="alert">
              {state.fieldErrors.status}
            </p>
          ) : null}
        </div>
      </div>

      {state.formError ? (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {state.formError}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  required,
  value,
  defaultValue,
  onChange,
  error,
  placeholder,
  hint,
}: {
  id: string;
  name: string;
  label: string;
  type?: "text" | "date";
  required?: boolean;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  error?: string;
  placeholder?: string;
  hint?: string;
}) {
  const isControlled = onChange !== undefined && value !== undefined;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-destructive ml-1">*</span> : null}
      </Label>
      <Input
        id={id}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={
          error ? `${id}-error` : hint ? `${id}-hint` : undefined
        }
        {...(isControlled
          ? {
              value,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                onChange(e.target.value),
            }
          : { defaultValue })}
      />
      {error ? (
        <p id={`${id}-error`} className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-muted-foreground text-xs">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="bg-pdp-orange hover:bg-pdp-orange/90 text-white"
    >
      {pending ? (
        <Loader2Icon className="animate-spin" aria-hidden />
      ) : (
        <SaveIcon aria-hidden />
      )}
      {pending ? "Đang lưu..." : label}
    </Button>
  );
}
