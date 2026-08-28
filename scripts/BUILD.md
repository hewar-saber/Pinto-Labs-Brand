# How this bundle was generated

Everything in `public/` is derived from source in this repo — no Figma
round-trip. The three colourways are **red** `#FF4016`, **white** `#FFFFFF`
and **black** `#000000`.

| Step | Script | What it does |
|---|---|---|
| 1 | `wordmark.py` | Instances Crimson Pro VF at `wght 800`, shapes "Pinto Labs" with HarfBuzz (kerning + ligatures on), and writes the outlined glyphs as one SVG path (`wordmark.path`) plus its bbox. |
| 2 | `build_lockups.py` | Composes the four lockups from the bean path (inlined in the script, rotated 90° to landscape) + the outlined wordmark, in every colourway, as Normal (tight-crop) and Padded (clear-space) SVG. Writes `lockups.json`. |
| 3 | `build_library.mjs` | Rasterises each SVG to PNG at 256 / 512 / 1024 / 2048 px **wide** with sharp, and lays the whole `Logos/` tree out on disk. |
| 4 | `build_extras.mjs` | Favicons and social plates. |
| 5 | `build_manifest.mjs` | Walks `public/` and writes `public/manifest.json` — the file list the "Download all" zip is built from. |

Run steps 1–4 from the repo root, with a scratch directory for the
intermediates. `wordmark.py` resolves the Crimson Pro TTF from
`public/Fonts`, and `build_lockups.py` reads `wordmark.path` out of the same
directory it writes `lockups.json` into, so keep the scratch path consistent:

```
python3 scripts/wordmark.py       <scratch>/wordmark.path
python3 scripts/build_lockups.py  <scratch>/lockups.json
node    scripts/build_library.mjs <scratch> public
node    scripts/build_extras.mjs  <scratch> public
node    scripts/build_manifest.mjs            # optionally: YYYY-MM-DD
```

The committed `lockups.json` / `wordmark.path` / `wordmark.path.bbox` in this
directory are the intermediates from the last cut; copy them into `<scratch>`
to re-run only steps 3–5.

`wordmark.py` and `build_lockups.py` need `fonttools`, `brotli` and
`uharfbuzz` (`pip install fonttools brotli uharfbuzz`). `build_library.mjs`
and `build_extras.mjs` need `sharp` (`npm i -D sharp`); it is not a dependency
of the site itself, only of a regeneration.

Always finish with `build_manifest.mjs` — the zip is built from the manifest,
so a stale manifest silently ships a stale archive.
