# Brand assets

Files are in `public/`. Browse them at `/`.

## Paths

```
Logos/<Variant>/PNG/<Crop>/<Size>/<Colour>.png
Logos/<Variant>/SVG/<Crop>/<Colour>.svg
```

| Slot | Values |
|---|---|
| Variant | Primary Logo, Brand Symbol, Wordmark, Center |
| Crop | Normal (tight), Padded (with clear space) |
| Size | 256, 512, 1024, 2048. This is the width in px. |
| Colour | red `#FF4016`, white `#FFFFFF`, black `#000000` |

## Approved combinations

Red on white, white on red, black on white. Nothing else.

Exported files carry the artwork in one flat colour, on transparency. The
ground is a usage rule, not part of the file.

## Clear space

Half the bean's bounding box on each axis: half its width left and right,
half its height top and bottom. The Padded crop has it built in.

## Icons

| File | Size | Mark |
|---|---|---|
| Default.png | 512 x 512 | red, transparent |
| Monochrome.png | 512 x 512 | black, transparent |
| Apple.png | 180 x 180 | white on a red tile, opaque |

## Social

Art comes from Figma directly, not generated here.

| File | Size |
|---|---|
| Twitter Header.png | 3000 x 1000 |
| LinkedIn Cover.png | 1584 x 396 |
| Profile Picture.png | 1000 x 1000 |

## Still open

No minimum sizes or misuse rules defined yet.

## Fonts

Full variable families with their OFL licences, in `public/Fonts`.
TTF for design and print, WOFF2 for web.

## Regenerating

Logos and icons: see `scripts/BUILD.md`. After changing anything in `public/`,
run `node scripts/build_manifest.mjs` so the Download all zip picks it up.
