/**
 * The gate.
 *
 * `proxy.ts` is Next 16's request-interception convention (it replaced
 * `middleware.ts`, which is deprecated) and it runs before the filesystem
 * routes — before `public/`, before `app/`. That ordering is the whole point
 * here: the brand library is served straight out of `public/`, so a direct hit
 * on `/Logos/Primary Logo/PNG/Normal/2048/red.png` has to be refused by the
 * same check that refuses the page, and only something running ahead of static
 * file serving can do that.
 *
 * The matcher therefore excludes as little as possible — just the build output
 * needed to render the sign-in page itself.
 */

import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, isConfigured, verifySession } from "./lib/session";

export const config = {
  matcher: [
    /*
     * Everything except Next's own build output:
     * - _next/static  the sign-in page's own CSS, JS and fonts
     * - _next/image   the image optimiser (unused here, excluded for parity)
     *
     * Note that `public/` is deliberately NOT excluded — gating it is the
     * reason this file exists.
     */
    "/((?!_next/static|_next/image).*)",
  ],
};

const SIGN_IN = "/signin";

/** A path that looks like a file, rather than a page to redirect a human to. */
const isFileRequest = (pathname: string) =>
  pathname.slice(pathname.lastIndexOf("/") + 1).includes(".");

function deny(request: NextRequest, status: number, message: string) {
  // Files get a plain refusal; a browser navigating to a page gets the form.
  if (status === 401 && !isFileRequest(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = SIGN_IN;
    url.search = "";
    const from = request.nextUrl.pathname + request.nextUrl.search;
    // Only ever bounce back to a path on this origin.
    if (from !== "/" && from.startsWith("/") && !from.startsWith("//")) {
      url.searchParams.set("from", from);
    }
    return NextResponse.redirect(url);
  }

  return new NextResponse(`${message}\n`, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export function proxy(request: NextRequest) {
  // Fail closed. With no password configured there is no way to sign in, so
  // nothing is served at all — including the sign-in page, which would
  // otherwise be a form that can never succeed.
  if (!isConfigured()) {
    return deny(
      request,
      503,
      "This site is not configured: BRAND_PASSWORD is unset. " +
        "Set it in the environment and restart.",
    );
  }

  const { pathname } = request.nextUrl;
  const signedIn = verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === SIGN_IN) {
    // Already in? Skip the form. POSTs are the sign-in Server Function itself,
    // and the sign-out Server Function, so those always pass through.
    if (signedIn && request.method === "GET") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (signedIn) return NextResponse.next();

  return deny(request, 401, "Unauthorized. Sign in at /signin.");
}
