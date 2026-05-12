"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/auth";

import type { LoginState } from "./types";

const SAFE_REDIRECT_PREFIX = "/admin";
const DEFAULT_AFTER_LOGIN = "/admin";

function pickSafeRedirect(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_AFTER_LOGIN;
  // Only allow same-origin admin paths to avoid an open redirect.
  if (!raw.startsWith(SAFE_REDIRECT_PREFIX)) return DEFAULT_AFTER_LOGIN;
  return raw;
}

export async function signIn(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    redirectTo: formData.get("redirectTo"),
  });

  if (!parsed.success) {
    const fieldErrors: LoginState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "email" || key === "password") {
        fieldErrors[key] = issue.message;
      }
    }
    return { formError: null, fieldErrors };
  }

  const { email, password, redirectTo } = parsed.data;

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch (err) {
    if (err instanceof Error && err.message.includes("Missing Supabase env")) {
      return {
        formError: "Hệ thống chưa được cấu hình. Vui lòng quay lại sau.",
        fieldErrors: {},
      };
    }
    throw err;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Don't leak which half is wrong — same message for invalid email vs
    // invalid password.
    return {
      formError: "Email hoặc mật khẩu không chính xác.",
      fieldErrors: {},
    };
  }

  redirect(pickSafeRedirect(redirectTo));
}

export async function signOut(): Promise<void> {
  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch {
    redirect("/login");
  }

  await supabase.auth.signOut();
  redirect("/login");
}
