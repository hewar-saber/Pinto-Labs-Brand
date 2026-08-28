"use client";

import { useEffect, useRef, useState } from "react";

import { signOut } from "@/app/auth-actions";

import { makeZip } from "./zip";

/**
 * BrandAssets — the index over public/.
 *
 * Every card points at a real file in public/, so the preview and the download
 * link are the same artefact: if a card looks wrong, the export is wrong.
 * Previews are always the SVG (crisp at any card size); the download hands over
 * whatever format the toolbar is set to.
 *
 * Cards are grouped by what they are, so the group heading carries the name
 * and each card only has to carry what makes it different from its siblings.
 */

const VARIANTS = [
  "Primary Logo",
  "Brand Symbol",
  "Wordmark",
  "Center",
] as const;

/**
 * The three approved combinations. The exported file is the artwork in one
 * flat colour on transparency; `ground` is the surface it is approved against,
 * which is what the preview sits it on.
 */
const COLORS = [
  { name: "red", label: "Red on white", ground: "#ffffff" },
  { name: "white", label: "White on red", ground: "#ff4016" },
  { name: "black", label: "Black on white", ground: "#ffffff" },
] as const;

const CROPS = ["Normal", "Padded"] as const;
const SIZES = ["svg", "256", "512", "1024", "2048"] as const;

const SECTIONS = [
  { id: "logos", label: "Logos" },
  { id: "icons", label: "Icons" },
  { id: "social", label: "Social" },
  { id: "fonts", label: "Fonts" },
] as const;

const ICONS = [
  { file: "Default.png", w: 512, h: 512 },
  { file: "Monochrome.png", w: 512, h: 512 },
  { file: "Apple.png", w: 180, h: 180 },
];

const COVERS = [
  { file: "Twitter Header.png", title: "Twitter", w: 3000, h: 1000 },
  { file: "LinkedIn Cover.png", title: "LinkedIn", w: 1584, h: 396 },
];

const AVATARS = [
  { file: "Profile Picture.png", title: "Profile Picture", w: 1000, h: 1000 },
];

/** Families ship whole: both formats, both styles, and the licence. */
const FONTS = [
  {
    family: "Archivo",
    dir: "Archivo",
    stack: "var(--font-archivo)",
    role: "Body and UI",
    files: [
      "Archivo-VF.woff2",
      "Archivo-VF.ttf",
      "Archivo-Italic-VF.woff2",
      "Archivo-Italic-VF.ttf",
      "OFL.txt",
    ],
  },
  {
    family: "Crimson Pro",
    dir: "Crimson Pro",
    stack: "var(--font-crimson-pro)",
    role: "Display and the wordmark",
    files: [
      "CrimsonPro-VF.woff2",
      "CrimsonPro-VF.ttf",
      "CrimsonPro-Italic-VF.woff2",
      "CrimsonPro-Italic-VF.ttf",
      "OFL.txt",
    ],
  },
] as const;

type Crop = (typeof CROPS)[number];
type Size = (typeof SIZES)[number];

const slug = (s: string) => s.replace(/ /g, "-");

/** public/ paths carry spaces; the browser needs them encoded. */
const asset = (path: string) => `/${encodeURI(path)}`;

function Card({
  src,
  href,
  download,
  title,
  note,
  ground = "#ffffff",
}: {
  src: string;
  href: string;
  download: string;
  title: string;
  note?: string;
  ground?: string;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div
        className="grid h-[150px] place-items-center border border-black/12 p-[18px]"
        style={{ background: ground }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={title} className="max-h-[114px] max-w-full" />
      </div>
      <div className="flex items-baseline justify-between gap-2.5">
        <strong className="text-[16px] leading-[1.2] font-medium text-black">
          {title}
        </strong>
        {note ? (
          <span className="text-[14px] leading-[1.2] font-medium text-black/70 tabular-nums">
            {note}
          </span>
        ) : null}
      </div>
      <a
        href={href}
        download={download}
        className="text-brand hover:text-accent self-start text-[16px] leading-[1.2] font-bold transition-colors"
      >
        Download
      </a>
    </div>
  );
}

/** One row of siblings under a heading that names what they have in common. */
function Group({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* globals.css sets h1–h3 to the serif in an unlayered rule, which beats
          any font utility (unlayered CSS wins over @layer utilities). Nothing
          here sets the serif below 24px, so this one is pinned to Archivo. */}
      <h3
        className="text-[16px] leading-[1.2] font-medium text-black/70"
        style={{ fontFamily: "var(--font-archivo)" }}
      >
        {heading}
      </h3>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

function Section({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-[72px] pt-28 sm:pt-44">
      <h2 className="mb-10 text-[24px] leading-[1.1] font-medium text-black/90">
        {label}
      </h2>
      <div className="flex flex-col gap-14">{children}</div>
    </section>
  );
}

function Seg<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="flex gap-1" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
          className={`cursor-pointer px-1.5 py-0.5 text-[16px] leading-[1.2] transition-colors ${
            value === o
              ? "bg-brand font-bold text-white"
              : "hover:text-accent font-medium text-black/70"
          }`}
        >
          {o === "svg" ? "SVG" : o}
        </button>
      ))}
    </div>
  );
}

/** Which section the toolbar is currently sitting in, read once per frame. */
function useActiveSection(ids: readonly string[], offset: number) {
  const [active, setActive] = useState(ids[0]);
  const frame = useRef(0);

  useEffect(() => {
    const read = () => {
      frame.current = 0;
      const line = document.documentElement.scrollTop + offset + 1;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= line) current = id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame.current) frame.current = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ids, offset]);

  return active;
}

interface Manifest {
  version: string;
  files: string[];
  bytes: number;
}

/**
 * Fetches every file named in public/manifest.json and zips them in the
 * browser. The manifest is generated from what is actually on disk
 * (scripts/build_manifest.mjs), so the archive can never drift from the bundle
 * the way a hardcoded file list would.
 */
function useBundleDownload() {
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const run = async () => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    setDone(0);
    try {
      const manifest: Manifest = await fetch("/manifest.json").then((r) => {
        if (!r.ok) throw new Error(`manifest ${r.status}`);
        return r.json();
      });
      setTotal(manifest.files.length);

      const root = `PintoLabs-Brand-Assets-${manifest.version}`;
      const entries = [];
      for (const file of manifest.files) {
        const res = await fetch(asset(file));
        if (!res.ok) throw new Error(`${file} ${res.status}`);
        entries.push({
          path: `${root}/${file}`,
          data: new Uint8Array(await res.arrayBuffer()),
        });
        setDone((n) => n + 1);
      }

      const url = URL.createObjectURL(makeZip(entries));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${root}.zip`;
      a.click();
      // Revoke on the next frame; revoking synchronously can beat the click.
      requestAnimationFrame(() => URL.revokeObjectURL(url));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const label = failed
    ? "Download failed, retry"
    : busy
      ? total
        ? `Zipping ${done} of ${total}`
        : "Zipping"
      : "Download all";

  return { run, busy, label };
}

const SECTION_IDS = SECTIONS.map((s) => s.id);

export default function BrandAssets() {
  const [crop, setCrop] = useState<Crop>("Normal");
  const [size, setSize] = useState<Size>("svg");
  const active = useActiveSection(SECTION_IDS, 80);
  const bundle = useBundleDownload();

  const isSvg = size === "svg";

  /**
   * The anchors work on their own; this only upgrades the jump to a glide.
   * scrollIntoView honours the section's scroll-margin, so the landing
   * position is identical either way.
   */
  const goTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <main className="min-h-screen bg-white px-5 pb-40 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-[1240px]">
        <header className="flex items-center gap-5 pt-8 sm:pt-16">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset("Logos/Brand Symbol/SVG/Normal/red.svg")}
            alt=""
            aria-hidden
            className="h-[34px] w-[66px] max-w-none"
          />
          <span className="text-brand font-serif text-[28px] leading-[1.1] font-extrabold">
            Pinto Labs
          </span>
          <form action={signOut} className="ml-auto">
            <button
              type="submit"
              className="hover:text-accent cursor-pointer text-[16px] leading-[1.2] font-medium text-black/70 transition-colors"
            >
              Sign out
            </button>
          </form>
        </header>

        <h1 className="mt-10 mb-3 text-[22.4px] leading-[1.1] font-medium text-black sm:text-[32px]">
          Assets
        </h1>
        <p className="text-[16px] leading-[1.2] font-medium text-black/70">
          120 logo files, 3 icons, 3 social, 2 font families. Showing {crop},{" "}
          {isSvg ? "SVG" : `${size}px`}.
        </p>

        <div className="sticky top-0 z-10 mt-7 border-b border-black/12 bg-white">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3.5">
            <nav className="flex gap-1" aria-label="Sections">
              {SECTIONS.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  onClick={(e) => goTo(e, sec.id)}
                  aria-current={active === sec.id ? "true" : undefined}
                  className={`px-1.5 py-0.5 text-[16px] leading-[1.2] transition-colors ${
                    active === sec.id
                      ? "font-bold text-black"
                      : "hover:text-accent font-medium text-black/70"
                  }`}
                >
                  {sec.label}
                </a>
              ))}
            </nav>
            <div className="ml-auto flex flex-wrap items-center gap-x-6 gap-y-2">
              <Seg
                value={crop}
                options={CROPS}
                onChange={setCrop}
                label="Crop"
              />
              <Seg
                value={size}
                options={SIZES}
                onChange={setSize}
                label="Size"
              />
              <button
                type="button"
                onClick={bundle.run}
                disabled={bundle.busy}
                className="bg-brand cursor-pointer px-1.5 py-0.5 text-[16px] leading-[1.2] font-bold whitespace-nowrap text-white transition-opacity hover:opacity-80 disabled:cursor-wait disabled:opacity-60"
              >
                {bundle.label}
              </button>
            </div>
          </div>
        </div>

        <Section id="logos" label="Logos">
          {VARIANTS.map((v) => (
            <Group key={v} heading={v}>
              {COLORS.map((color) => (
                <Card
                  key={color.name}
                  src={asset(`Logos/${v}/SVG/${crop}/${color.name}.svg`)}
                  href={asset(
                    isSvg
                      ? `Logos/${v}/SVG/${crop}/${color.name}.svg`
                      : `Logos/${v}/PNG/${crop}/${size}/${color.name}.png`,
                  )}
                  download={`Pinto_${slug(v)}_${crop}_${
                    isSvg ? "" : `${size}_`
                  }${color.name}.${isSvg ? "svg" : "png"}`}
                  title={color.label}
                  ground={color.ground}
                />
              ))}
            </Group>
          ))}
        </Section>

        <Section id="icons" label="Icons">
          <Group heading="Favicon">
            {ICONS.map((it) => (
              <Card
                key={it.file}
                src={asset(`Logos/Favicon/${it.file}`)}
                href={asset(`Logos/Favicon/${it.file}`)}
                download={`Pinto_${slug(it.file)}`}
                title={it.file.replace(/\.png$/, "")}
                note={`${it.w} x ${it.h}`}
              />
            ))}
          </Group>
        </Section>

        <Section id="social" label="Social">
          <Group heading="Covers">
            {COVERS.map((it) => (
              <Card
                key={it.file}
                src={asset(`Social Media/${it.file}`)}
                href={asset(`Social Media/${it.file}`)}
                download={`Pinto_${slug(it.file)}`}
                title={it.title}
                note={`${it.w} x ${it.h}`}
              />
            ))}
          </Group>
          <Group heading="Avatar">
            {AVATARS.map((it) => (
              <Card
                key={it.file}
                src={asset(`Social Media/${it.file}`)}
                href={asset(`Social Media/${it.file}`)}
                download={`Pinto_${slug(it.file)}`}
                title={it.title}
                note={`${it.w} x ${it.h}`}
              />
            ))}
          </Group>
        </Section>

        <Section id="fonts" label="Fonts">
          {FONTS.map((f) => (
            <Group key={f.family} heading={`${f.family} — ${f.role}`}>
              <div className="col-span-full flex flex-col gap-4">
                <div
                  className="border border-black/12 px-[18px] py-6 text-[34px] leading-[1.15] text-black"
                  style={{ fontFamily: f.stack }}
                >
                  Pinto Labs — Aa Bb Cc 0123
                </div>
                <ul className="flex flex-wrap gap-x-6 gap-y-2">
                  {f.files.map((file) => (
                    <li key={file}>
                      <a
                        href={asset(`Fonts/${f.dir}/${file}`)}
                        download={file}
                        className="text-brand hover:text-accent text-[16px] leading-[1.2] font-bold transition-colors"
                      >
                        {file}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </Group>
          ))}
        </Section>
      </div>
    </main>
  );
}
