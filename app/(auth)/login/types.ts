/**
 * Shared types/constants for the login feature.
 *
 * Lives in a non-`"use server"` module so the client form can import the
 * initial state. In Next.js 16, `"use server"` files may only export async
 * functions — non-function exports become `undefined` on the client and
 * crash `useActionState`.
 */
export type LoginState = {
  formError: string | null;
  fieldErrors: { email?: string; password?: string };
};

export const initialLoginState: LoginState = {
  formError: null,
  fieldErrors: {},
};
