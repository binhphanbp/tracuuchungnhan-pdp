"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";

export type PublishResult =
  | { ok: true; affected: number }
  | { ok: false; error: string };

/**
 * Flip a campaign to `published`. Cascades to every certificate in the
 * campaign so they become publicly lookup-able. Useful after the admin has
 * uploaded the generated PNGs to Drive and wants to release them.
 */
export async function publishCampaign(
  campaignId: string,
): Promise<PublishResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { error: campaignErr } = await supabase
    .from("campaigns")
    .update({ status: "published" })
    .eq("id", campaignId);
  if (campaignErr) return { ok: false, error: campaignErr.message };

  // Also publish all certificates (only the ones that aren't revoked — the
  // admin may have manually revoked specific certs).
  const { data: updated, error: certErr } = await supabase
    .from("certificates")
    .update({ status: "published" })
    .eq("campaign_id", campaignId)
    .eq("status", "draft")
    .select("id");
  if (certErr) return { ok: false, error: certErr.message };

  revalidatePath(`/admin/campaigns/${campaignId}`);
  revalidatePath(`/admin/campaigns/${campaignId}/certificates`);
  revalidatePath(`/admin/certificates`);
  return { ok: true, affected: updated?.length ?? 0 };
}

/**
 * Reverse of `publishCampaign`. Sets the campaign back to draft and reverts
 * any *currently published* certificates back to draft. Revoked certs are
 * left alone.
 */
export async function unpublishCampaign(
  campaignId: string,
): Promise<PublishResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { error: campaignErr } = await supabase
    .from("campaigns")
    .update({ status: "draft" })
    .eq("id", campaignId);
  if (campaignErr) return { ok: false, error: campaignErr.message };

  const { data: updated, error: certErr } = await supabase
    .from("certificates")
    .update({ status: "draft" })
    .eq("campaign_id", campaignId)
    .eq("status", "published")
    .select("id");
  if (certErr) return { ok: false, error: certErr.message };

  revalidatePath(`/admin/campaigns/${campaignId}`);
  revalidatePath(`/admin/campaigns/${campaignId}/certificates`);
  revalidatePath(`/admin/certificates`);
  return { ok: true, affected: updated?.length ?? 0 };
}
