"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2Icon, LogInIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "./actions";
import { initialLoginState } from "./types";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction] = useActionState(signIn, initialLoginState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="redirectTo" value={redirectTo ?? ""} />

      <Field
        id="email"
        name="email"
        label="Email quản trị"
        type="email"
        autoComplete="email"
        required
        error={state.fieldErrors.email}
      />

      <Field
        id="password"
        name="password"
        label="Mật khẩu"
        type="password"
        autoComplete="current-password"
        required
        error={state.fieldErrors.password}
      />

      {state.formError ? (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {state.formError}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

function Field({
  id,
  name,
  label,
  type,
  autoComplete,
  required,
  error,
}: {
  id: string;
  name: string;
  label: string;
  type: "email" | "password" | "text";
  autoComplete: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${id}-error` : undefined}
        className="h-11"
      />
      {error ? (
        <p id={`${id}-error`} className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      className="bg-pdp-orange hover:bg-pdp-orange/90 h-11 w-full text-white"
    >
      {pending ? (
        <Loader2Icon className="animate-spin" aria-hidden />
      ) : (
        <LogInIcon aria-hidden />
      )}
      {pending ? "Đang đăng nhập..." : "Đăng nhập"}
    </Button>
  );
}
