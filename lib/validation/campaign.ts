import { z } from "zod";

export const campaignStatusEnum = z.enum(["draft", "published", "archived"]);
export type CampaignStatus = z.infer<typeof campaignStatusEnum>;

const slugSchema = z
  .string()
  .min(1, "Slug không được để trống.")
  .max(120, "Slug không quá 120 ký tự.")
  .regex(
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
    "Slug chỉ chứa chữ thường, số và dấu gạch ngang.",
  );

const optionalString = (max: number, label: string) =>
  z
    .string()
    .max(max, `${label} không quá ${max} ký tự.`)
    .optional()
    .or(z.literal(""));

const driveFolderIdSchema = z
  .string()
  .max(120, "Drive folder ID quá dài.")
  .regex(
    /^[A-Za-z0-9_-]+$/,
    "Drive folder ID chỉ chứa chữ, số, gạch dưới và gạch ngang.",
  )
  .optional()
  .or(z.literal(""));

export const campaignFormSchema = z.object({
  title: z
    .string()
    .min(3, "Tên chiến dịch tối thiểu 3 ký tự.")
    .max(200, "Tên chiến dịch tối đa 200 ký tự."),
  slug: slugSchema,
  description: optionalString(2000, "Mô tả"),
  issue_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày cấp phải có định dạng YYYY-MM-DD."),
  signer_name: optionalString(150, "Tên người ký"),
  signer_title: optionalString(150, "Chức vụ người ký"),
  drive_folder_id: driveFolderIdSchema,
  status: campaignStatusEnum.default("draft"),
});

export type CampaignFormInput = z.input<typeof campaignFormSchema>;
export type CampaignFormValues = z.output<typeof campaignFormSchema>;
