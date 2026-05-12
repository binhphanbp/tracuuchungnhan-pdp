"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Branded confirmation dialog. Wraps a trigger and renders a Radix Dialog
 * with title/description + two buttons. Replaces ad-hoc `window.confirm()`
 * usage so the UX matches the rest of the app.
 *
 * Usage:
 *
 *   <ConfirmDialog
 *     title="Phát hành chiến dịch?"
 *     description="..."
 *     confirmLabel="Phát hành"
 *     onConfirm={async () => { ... }}
 *     trigger={<Button>Phát hành</Button>}
 *   />
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Huỷ",
  variant = "default",
  onConfirm,
}: {
  trigger: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive" | "primary";
  onConfirm: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        await onConfirm();
      } finally {
        setOpen(false);
      }
    });
  };

  // We intentionally render the trigger via DialogTrigger asChild equivalent
  // by using a button wrapper — Radix DialogTrigger expects a single child
  // that accepts onClick. To stay flexible, accept any ReactNode and wire
  // click via a wrapping span.
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <span onClick={() => setOpen(true)} className="contents">
        {trigger}
      </span>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            disabled={pending}
            onClick={handleConfirm}
            className={
              variant === "destructive"
                ? "bg-destructive hover:bg-destructive/90 text-white"
                : variant === "primary"
                  ? "bg-pdp-orange hover:bg-pdp-orange/90 text-white"
                  : undefined
            }
          >
            {pending ? "Đang xử lý..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
