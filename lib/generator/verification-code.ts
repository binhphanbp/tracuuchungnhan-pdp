import { customAlphabet } from "nanoid";

/**
 * Verification codes embedded in QR codes and printed on the certificate.
 * Uses a 32-character alphabet that excludes ambiguous glyphs (0/O, 1/I/l,
 * uppercase only) so codes are easy to read off a printed certificate.
 *
 * Length 12 → ~60 bits of entropy. Plenty for a per-campaign roster of a
 * few thousand certificates while keeping the QR code small enough to print
 * legibly at certificate scale.
 */
const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const CODE_LENGTH = 12;

const generateCode = customAlphabet(CODE_ALPHABET, CODE_LENGTH);

export function newVerificationCode(): string {
  return generateCode();
}

/**
 * Produce the canonical verification URL stamped onto the QR code. Reads
 * `NEXT_PUBLIC_SITE_URL` so previews work both in dev and on the deployed
 * `tracuuchungnhan-pdp.edu.vn` domain.
 */
export function verificationUrlFor(code: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "";
  return `${base}/verify/${code}`;
}
