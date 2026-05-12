import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";

import { GeneratorWizard } from "@/components/admin/generator-wizard";
import { createClient } from "@/lib/supabase/server";
import {
  type TemplateConfig,
  DEFAULT_TEMPLATE_CONFIG,
  templateConfigSchema,
} from "@/lib/generator/template-config";

export const metadata = { title: "Sinh chứng nhận" };

type Params = Promise<{ campaignId: string }>;

export default async function GeneratorPage({ params }: { params: Params }) {
  const { campaignId } = await params;
  const supabase = await createClient();

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("id, title, slug, template_config")
    .eq("id", campaignId)
    .maybeSingle();

  if (error) {
    return (
      <div className="text-destructive text-sm">
        Không thể tải chiến dịch: {error.message}
      </div>
    );
  }
  if (!campaign) notFound();

  // Try to parse the stored template_config; fall back to defaults if it's
  // empty (`{}` from the schema default) or shape-incompatible (e.g. seeded
  // before this milestone landed).
  const initialConfig: TemplateConfig =
    parseStoredConfig(campaign.template_config) ?? DEFAULT_TEMPLATE_CONFIG;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/campaigns/${campaign.id}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeftIcon className="size-4" aria-hidden />
          Quay lại {campaign.title}
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Sinh chứng nhận
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Chiến dịch <span className="font-medium">{campaign.title}</span>. Quá
          trình sinh ảnh chạy hoàn toàn trên trình duyệt của bạn — phù hợp cho
          hàng trăm đến hàng nghìn chứng nhận.
        </p>
      </div>

      <GeneratorWizard
        campaignId={campaign.id}
        campaignTitle={campaign.title}
        campaignSlug={campaign.slug}
        initialConfig={initialConfig}
      />
    </div>
  );
}

function parseStoredConfig(raw: unknown): TemplateConfig | null {
  const parsed = templateConfigSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
