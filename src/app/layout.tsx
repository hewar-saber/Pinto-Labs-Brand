import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";

/*
 * The two brand faces are loaded from the library this site exists to hand
 * out (public/Fonts), not from a font CDN — the page and the download are then
 * demonstrably the same files. next/font copies them into the build output, so
 * they are served from /_next/static and stay readable on the sign-in page,
 * which by definition renders before anyone is past the gate.
 */

const crimsonPro = localFont({
  src: [
    {
      path: "../../public/Fonts/Crimson Pro/CrimsonPro-VF.woff2",
      style: "normal",
    },
    {
      path: "../../public/Fonts/Crimson Pro/CrimsonPro-Italic-VF.woff2",
      style: "italic",
    },
  ],
  weight: "200 900",
  variable: "--font-crimson-pro",
  display: "swap",
});

const archivo = localFont({
  src: [
    { path: "../../public/Fonts/Archivo/Archivo-VF.woff2", style: "normal" },
    {
      path: "../../public/Fonts/Archivo/Archivo-Italic-VF.woff2",
      style: "italic",
    },
  ],
  weight: "100 900",
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Brand assets — Pinto Labs",
  description: "Logo, icon, social and font exports.",
  // Private by construction, but say so anyway.
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${crimsonPro.variable} ${archivo.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
