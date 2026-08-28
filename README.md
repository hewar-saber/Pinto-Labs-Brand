# Pinto Labs brand assets

The Pinto Labs logo library, browsable and downloadable, behind a shared
password. Split out of the marketing site so the assets can be handed to
partners without giving anyone the site repo.

## Running it

```bash
npm install
cp .env.example .env.local     # then set BRAND_PASSWORD
npm run dev                    # http://localhost:3000
```

`npm run build` then `npm run start` for production. The app refuses every
request until `BRAND_PASSWORD` is set — see below.

## The password gate

One shared password for the whole site, read from `BRAND_PASSWORD`. There is
no user store.

- **`src/proxy.ts`** is the gate. `proxy.ts` is Next 16's request-interception
  convention (it replaced `middleware.ts`) and it runs *before* the filesystem
  routes. That ordering is the point: the library is served straight out of
  `public/`, so a direct hit on a logo file is refused by the same check that
  refuses the page.
- **`src/lib/session.ts`** mints and verifies the cookie. The session is a
  self-describing token, `<expiry>.<hmac>`, signed with a key derived from the
  password — nothing to persist server-side. The cookie is `httpOnly`, so it is
  never readable from client JS.
- The password is compared in **constant time**, on hashes of both sides, so
  the check leaks neither length nor how far a guess got.
- **It fails closed.** With `BRAND_PASSWORD` unset every request gets a 503,
  including the sign-in form — a form that could never succeed is worse than an
  honest error.
- Changing `BRAND_PASSWORD` or `BRAND_SESSION_SECRET` invalidates every
  outstanding session.

| Variable | Required | Meaning |
| --- | --- | --- |
| `BRAND_PASSWORD` | yes | The shared password. |
| `BRAND_SESSION_SECRET` | no | Extra secret in the cookie's HMAC, so sessions can be revoked without changing the password. |
| `BRAND_SESSION_DAYS` | no | Session lifetime. Defaults to 30. |

## Layout

```
public/
  Logos/<Variant>/<Format>/<Crop>/[<Size>/]<colour>.<ext>
  Social Media/          Twitter header, LinkedIn cover, profile picture
  Fonts/                 Archivo and Crimson Pro, TTF and WOFF2, with licences
  manifest.json          every file on disk; drives the page and the zip
  ASSETS.md              naming, clear space, approved combinations
scripts/                 the generators — see scripts/BUILD.md
src/
  proxy.ts               the gate
  lib/session.ts         cookie minting and verification
  app/signin/            the form
  app/page.tsx           the library index
  components/            the index UI and the in-browser zip
```

Colourways are **red** (`#FF4016`), **white** (`#FFFFFF`) and **black**
(`#000000`). Approved combinations: red on white, white on red, black on white.

## Regenerating the library

The generators are manual, run by hand, and documented in
`scripts/BUILD.md`. After changing anything under `public/`, rebuild the
manifest so the page and the "Download all" zip stay in step with disk:

```bash
npm run manifest
```
