"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SearchIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  lookupFormSchema,
  type LookupFormInput,
} from "@/lib/validation/student-code";

export function LookupForm({
  defaultStudentCode = "",
}: {
  defaultStudentCode?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LookupFormInput>({
    resolver: zodResolver(lookupFormSchema),
    defaultValues: { studentCode: defaultStudentCode },
  });

  const onSubmit = handleSubmit((values) => {
    setSubmitting(true);
    startTransition(() => {
      const code = values.studentCode.trim().toUpperCase();
      router.push(`/lookup?code=${encodeURIComponent(code)}`);
    });
  });

  const isBusy = submitting || isPending;
  const feedbackId = errors.studentCode
    ? "studentCode-error"
    : "studentCode-hint";

  return (
    <form
      onSubmit={(event) => {
        if (!isBusy) {
          void onSubmit(event);
        } else {
          event.preventDefault();
          toast.info("Vui lòng đợi một chút...");
        }
      }}
      className="flex w-full flex-col gap-2"
      noValidate
    >
      <Label htmlFor="studentCode" className="text-sm">
        Mã số sinh viên (MSSV)
      </Label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex flex-1 flex-col gap-2">
          <Input
            id="studentCode"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="VD: PS43995"
            aria-invalid={errors.studentCode ? "true" : "false"}
            aria-describedby={feedbackId}
            className="h-11 text-base uppercase"
            {...register("studentCode")}
          />
          {errors.studentCode ? (
            <p
              id="studentCode-error"
              className="text-destructive text-sm"
              role="alert"
            >
              {errors.studentCode.message}
            </p>
          ) : (
            <p id="studentCode-hint" className="text-muted-foreground text-xs">
              Định dạng MSSV: <code>PSxxxxx</code> (ví dụ{" "}
              <code>PS43995</code>).
            </p>
          )}
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={isBusy}
          className="bg-pdp-orange hover:bg-pdp-orange/90 h-11 w-full px-5 text-white sm:w-auto"
        >
          {isBusy ? (
            <Loader2Icon className="animate-spin" aria-hidden />
          ) : (
            <SearchIcon aria-hidden />
          )}
          Tra cứu
        </Button>
      </div>
    </form>
  );
}
