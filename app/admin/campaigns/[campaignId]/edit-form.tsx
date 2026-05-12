"use client";

import {
  CampaignForm,
  type CampaignFormDefaults,
  type CampaignFormState,
} from "@/components/admin/campaign-form";
import { updateCampaign } from "@/app/admin/campaigns/actions";

export function CampaignEditForm({
  campaignId,
  defaults,
}: {
  campaignId: string;
  defaults: CampaignFormDefaults;
}) {
  // Bind the campaignId to the server action so the shared CampaignForm
  // component stays generic between create and update.
  const boundUpdate = (
    prev: CampaignFormState,
    formData: FormData,
  ): Promise<CampaignFormState> => updateCampaign(campaignId, prev, formData);

  return (
    <CampaignForm
      action={boundUpdate}
      defaults={defaults}
      submitLabel="Lưu thay đổi"
    />
  );
}
