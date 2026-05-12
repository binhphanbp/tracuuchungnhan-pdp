"use client";

import { useTransition } from "react";
import { LogOutIcon, Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/app/(auth)/login/actions";

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={() => {
        startTransition(async () => {
          await signOut();
        });
      }}
    >
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={isPending}
        aria-label="Đăng xuất"
      >
        {isPending ? (
          <Loader2Icon className="animate-spin" aria-hidden />
        ) : (
          <LogOutIcon aria-hidden />
        )}
        <span className="hidden sm:inline">Đăng xuất</span>
      </Button>
    </form>
  );
}
