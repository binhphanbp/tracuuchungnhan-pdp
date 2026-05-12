"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { campaignFormSchema } from "@/lib/validation/campaign";
import {
  type CampaignFormState,
  initialCampaignFormState,
} from "@/components/admin/campaign-form";

const FIELD_KEYS = [
  "title",
  "slug",
  "description",
  "issue_date",
  "signer_name",
  "signer_title",
  "drive_folder_id",
  "status",
] as const;

function readFormData(formData: FormData) {
  const out: Record<string, FormDataEntryValue | null> = {};
  for (const key of FIELD_KEYS) {
    out[key] = formData.get(key);
  }
  return out;
}

function fieldErrorsFromZod(
  issues: import("zod").ZodIssue[],
): CampaignFormState["fieldErrors"] {
  const errs: CampaignFormState["fieldErrors"] = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (
      typeof key === "string" &&
      (FIELD_KEYS as readonly string[]).includes(key)
    ) {
      errs[key as keyof CampaignFormState["fieldErrors"]] = issue.message;
    }
  }
  return errs;
}

function emptyToNull(value: string | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export async function createCampaign(
  _prev: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  const admin = await requireAdmin();
  const parsed = campaignFormSchema.safeParse(readFormData(formData));
  if (!parsed.success) {
    return {
      ...initialCampaignFormState,
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: emptyToNull(parsed.data.description),
      issue_date: parsed.data.issue_date,
      signer_name: emptyToNull(parsed.data.signer_name),
      signer_title: emptyToNull(parsed.data.signer_title),
      drive_folder_id: emptyToNull(parsed.data.drive_folder_id),
      status: parsed.data.status,
      created_by: admin.sub,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        formError: null,
        fieldErrors: {
          slug: "Slug đã được sử dụng — chọn slug khác.",
        },
      };
    }
    return {
      formError: `Không thể lưu chiến dịch: ${error.message}`,
      fieldErrors: {},
    };
  }

  revalidatePath("/admin/campaigns");
  redirect(`/admin/campaigns/${data.id}`);
}

export async function updateCampaign(
  campaignId: string,
  _prev: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  await requireAdmin();
  const parsed = campaignFormSchema.safeParse(readFormData(formData));
  if (!parsed.success) {
    return {
      ...initialCampaignFormState,
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("campaigns")
    .update({
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: emptyToNull(parsed.data.description),
      issue_date: parsed.data.issue_date,
      signer_name: emptyToNull(parsed.data.signer_name),
      signer_title: emptyToNull(parsed.data.signer_title),
      drive_folder_id: emptyToNull(parsed.data.drive_folder_id),
      status: parsed.data.status,
    })
    .eq("id", campaignId);

  if (error) {
    if (error.code === "23505") {
      return {
        formError: null,
        fieldErrors: {
          slug: "Slug đã được sử dụng — chọn slug khác.",
        },
      };
    }
    return {
      formError: `Không thể cập nhật chiến dịch: ${error.message}`,
      fieldErrors: {},
    };
  }

  revalidatePath("/admin/campaigns");
  revalidatePath(`/admin/campaigns/${campaignId}`);
  return initialCampaignFormState;
}
