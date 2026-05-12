import type { PublicCertificate } from "./database";

/** Domain-level alias for the safe public-lookup result. */
export type LookupResult = PublicCertificate;

export type LookupErrorCode =
  | "not_found"
  | "invalid_student_code"
  | "rate_limited"
  | "internal_error";

export type LookupApiResponse =
  | { ok: true; certificate: LookupResult }
  | { ok: false; code: LookupErrorCode; message: string };
