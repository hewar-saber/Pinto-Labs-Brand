import type { Metadata } from "next";

import SignInForm from "./sign-in-form";

export const metadata: Metadata = {
  title: "Sign in — Pinto Labs brand assets",
  robots: { index: false, follow: false },
};

/*
 * The one page proxy.ts lets through unauthenticated, so it must not reference
 * anything out of public/ — every byte in there is behind the gate. The bean is
 * inlined for exactly that reason.
 */
const BEAN =
  "M15.0777 65.664C20.5079 65.664 23.492 63.3146 27.0459 58.464C31.4584 52.4416 " +
  "33.5097 42.8754 33.5097 32.832C33.5097 25.6297 33.257 20.6971 30.0413 13.5561C26.0353 " +
  "5.34127 22.4152 0 15.0777 0L15.0385 5.06276e-05C7.42921 0.019745 2.89037 4.32 0.806035 " +
  "12.8083C-1.06992 20.448 3.24467 25.6848 1.82967 35.712C0.0820783 48.096 -0.394205 " +
  "50.9139 0.317711 55.296C2.38609 62.496 6.66617 65.6423 15.0385 65.6639L15.0777 65.664Z";

export default async function SignIn({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const target = from && from.startsWith("/") && !from.startsWith("//") ? from : "/";

  return (
    <main className="grid min-h-screen place-items-center bg-white px-5 py-16">
      <div className="w-full max-w-[360px]">
        <div className="flex items-center gap-4">
          <svg
            viewBox="0 0 65.664 33.5097"
            className="h-[34px] w-[66px] shrink-0"
            aria-hidden
          >
            <g transform="translate(65.664 0) rotate(90)">
              <path d={BEAN} fill="#FF4016" />
            </g>
          </svg>
          <span className="text-brand font-serif text-[28px] leading-[1.1] font-extrabold">
            Pinto Labs
          </span>
        </div>

        <h1 className="mt-9 text-[22.4px] leading-[1.1] font-medium text-black sm:text-[32px]">
          Brand assets
        </h1>
        <p className="mt-3 text-[16px] leading-[1.35] font-medium text-black/70">
          Private. Enter the shared password to browse and download the library.
        </p>

        <SignInForm from={target} />
      </div>
    </main>
  );
}
