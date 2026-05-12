"use client";

import { useTransition } from "react";
import { Loader2Icon, RocketIcon, UndoIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  publishCampaign,
  unpublishCampaign,
} from "@/app/admin/campaigns/[campaignId]/actions";

export function PublishButton({
  campaignId,
  isPublished,
}: {
  campaignId: string;
  isPublished: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const handleConfirm = () => {
    return new Promise<void>((resolve) => {
      const action = isPublished ? unpublishCampaign : publishCampaign;
      const verb = isPublished ? "huỷ phát hành" : "phát hành";
      startTransition(async () => {
        const res = await action(campaignId);
        if (res.ok) {
          toast.success(
            `Đã ${verb} chiến dịch (${res.affected.toLocaleString("vi-VN")} chứng nhận).`,
          );
        } else {
          toast.error(res.error);
        }
        resolve();
      });
    });
  };

  if (isPublished) {
    return (
      <ConfirmDialog
        title="Huỷ phát hành chiến dịch?"
        description="Tất cả chứng nhận đang phát hành sẽ trở về trạng thái Nháp và không tra cứu được nữa. Bạn có thể phát hành lại sau."
        confirmLabel="Huỷ phát hành"
        cancelLabel="Đóng"
        variant="destructive"
        onConfirm={handleConfirm}
        trigger={
          <Button variant="outline" disabled={pending}>
            {pending ? (
              <Loader2Icon className="animate-spin" aria-hidden />
            ) : (
              <UndoIcon aria-hidden />
            )}
            Huỷ phát hành
          </Button>
        }
      />
    );
  }

  return (
    <ConfirmDialog
      title="Phát hành chiến dịch?"
      description="Tất cả chứng nhận đang ở trạng thái Nháp sẽ chuyển sang Đã phát hành và sinh viên có thể tra cứu được. Bạn có thể huỷ phát hành sau."
      confirmLabel="Phát hành"
      cancelLabel="Huỷ"
      variant="primary"
      onConfirm={handleConfirm}
      trigger={
        <Button
          disabled={pending}
          className="bg-emerald-600 text-white hover:bg-emerald-700"
        >
          {pending ? (
            <Loader2Icon className="animate-spin" aria-hidden />
          ) : (
            <RocketIcon aria-hidden />
          )}
          Phát hành chiến dịch
        </Button>
      }
    />
  );
}
