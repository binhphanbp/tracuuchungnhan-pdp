/**
 * Google Identity Services (GIS) Token Client wrapper.
 *
 * Browser-only OAuth: we never see a refresh token or store a long-lived
 * credential. The user clicks "Đăng nhập Google" → GIS pops a consent
 * screen → returns an access token good for ~1 hour. We hold it in memory
 * for the duration of the upload session and discard it afterwards.
 *
 * Default scope: `drive.file` — least privilege for direct uploads. Callers
 * can pass a narrower/different Drive scope when they only need metadata.
 */

import { GOOGLE_DRIVE_SCOPE, isGoogleDriveConfigured } from "./config";

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: TokenResponse) => void;
            error_callback?: (error: TokenError) => void;
          }) => TokenClient;
        };
        // `id` (the One Tap / Sign-In With Google) namespace exists too —
        // we don't use it for this app.
      };
    };
  }
}

type TokenResponse = {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: "Bearer";
  error?: string;
};

type TokenError = {
  type: string;
  message?: string;
};

type TokenClient = {
  requestAccessToken: (options?: { prompt?: "" | "consent" }) => void;
};

const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

let scriptPromise: Promise<void> | null = null;

/**
 * Load the GIS script tag once, idempotent across calls. Resolves when the
 * `window.google` object is available.
 */
export function loadGoogleIdentityServices(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Google Identity Services chỉ chạy ở trình duyệt."),
    );
  }
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GIS_SCRIPT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Không tải được Google Identity Services.")),
        { once: true },
      );
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Không tải được Google Identity Services."));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Request a Drive access token. Returns the token string + expiry epoch (ms).
 * Caller is responsible for refreshing when `expiresAt` passes.
 *
 * @param prompt If `"consent"`, force the consent screen even if the user
 *   already granted scopes (useful when a previous run failed and we want
 *   to re-authorize cleanly). Defaults to silent re-consent.
 */
export async function requestDriveAccessToken(
  options: "" | "consent" | { prompt?: "" | "consent"; scope?: string } = "",
): Promise<{ accessToken: string; expiresAt: number }> {
  if (!isGoogleDriveConfigured()) {
    throw new Error(
      "Chưa cấu hình NEXT_PUBLIC_GOOGLE_CLIENT_ID. Liên hệ quản trị hệ thống.",
    );
  }
  await loadGoogleIdentityServices();
  const google = window.google;
  if (!google?.accounts?.oauth2) {
    throw new Error("Google Identity Services không khả dụng.");
  }

  const prompt = typeof options === "string" ? options : (options.prompt ?? "");
  const scope =
    typeof options === "string"
      ? GOOGLE_DRIVE_SCOPE
      : (options.scope ?? GOOGLE_DRIVE_SCOPE);

  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string,
      scope,
      callback: (response) => {
        if (response.error) {
          reject(new Error(`Đăng nhập Google thất bại: ${response.error}`));
          return;
        }
        if (!response.access_token) {
          reject(new Error("Không nhận được access token từ Google."));
          return;
        }
        resolve({
          accessToken: response.access_token,
          // expires_in is in seconds; convert to absolute ms.
          expiresAt: Date.now() + response.expires_in * 1000,
        });
      },
      error_callback: (err) => {
        reject(
          new Error(err.message ?? `Đăng nhập Google thất bại: ${err.type}`),
        );
      },
    });
    client.requestAccessToken({ prompt });
  });
}
