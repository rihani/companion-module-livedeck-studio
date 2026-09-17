# companion-module-livedeck-studio

[Bitfocus Companion](https://bitfocus.io/companion) module for **LiveDeck Studio** — the iPad / iPhone / Android vision mixer.

Cue and take layouts, transitions, record, NDI / RTMP / HLS outputs, audio (mute / solo / faders / follow), Run a Show,
talkback, satellite messages, program resolution / orientation and the auto switch-away fallback — with live button
feedback over the Studio's event stream (`GET /api/events`).

## Studio side

1. Output → **Web remote** → on.
2. Output → **Control API** → copy the token.
3. Keep LiveDeck in the foreground (iOS closes the listener in the background).

## Install

- **This branch = the Companion 4.1–4.3 build** (module SDK `@companion-module/base` 1.13.6). The `main` branch (SDK 2.0.4) is for Companion 5.x.
- Package: `livedeck-studio-c4-<version>.tgz` on the Releases page.
- Until the module is in the Bitfocus store: **Modules → Import module package** and pick `livedeck-studio-<version>.tgz` from the Releases page.

## Develop

```
npm install
npm run build          # tsc → dist/
npm run package        # companion-module-build → pkg/ + livedeck-studio-<version>.tgz
```

For a developer setup, point Companion's *Developer modules path* (or `extraModulePath` in the headless `config.yaml`) at a folder that contains `pkg/livedeck-studio`.

## Studio API notes

- `GET /api/events` — `text/event-stream`, `event: state` with a compact state on change, `: ping` every 15 s.
- `GET /api/thumb/<layoutId>` / `GET /api/program.jpg` — JPEG images (token-gated).
- The Studio advertises `_livedeck-api._tcp` (TXT `role=studio`) so the connection can be picked from the list.

MIT.
