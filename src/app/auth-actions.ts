"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  SESSION_COOKIE,
  checkPassword,
  isConfigured,
  issueSession,
  sessionMaxAge,
} from "@/lib/session";

export interface SignInState {
  error?: string;
}

/** Only ever redirect to a path on this origin. */
function safePath(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export async function signIn(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  // The gate in proxy.ts lets every request to /signin through, so this
  // function has to stand on its own: it re-checks the configuration rather
  // than assuming anything upstream did.
  if (!isConfigured()) {
    return { error: "This site is not configured: BRAND_PASSWORD is unset." };
  }

  const password = formData.get("password");
  if (typeof password !== "string" || password.length === 0) {
    return { error: "Enter the password." };
  }

  if (!checkPassword(password)) {
    return { error: "That password is not right." };
  }

  const proto = (await headers()).get("x-forwarded-proto");
  const store = await cookies();
  store.set(SESSION_COOKIE, issueSession(), {
    httpOnly: true,
    sameSite: "lax",
    // Only pin the cookie to HTTPS when the request actually arrived over it,
    // so a plain-HTTP deployment on an internal network still works.
    secure: proto === "https",
    path: "/",
    maxAge: sessionMaxAge(),
  });

  redirect(safePath(formData.get("from")));
}

export async function signOut() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/signin");
}
