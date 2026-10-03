# companion-module-livedeck-studio

[Bitfocus Companion](https://bitfocus.io/companion) module for **LiveDeck**, the vision mixer for iPad, iPhone, Mac and Android ([manarlabs.com/apps/livedeck](https://manarlabs.com/apps/livedeck/)).

Take and cue layouts, GO LIVE, transitions, recording, NDI / RTMP / HLS outputs, PTZ presets and moves, audio (mute / solo / faders / follow), Run a Show, talkback, satellite messages, Program resolution / orientation and the auto switch-away fallback. Buttons follow the mixer live through the Studio's event stream (`GET /api/events`).

User documentation (setup, actions, feedbacks, variables, presets, troubleshooting): [companion/HELP.md](./companion/HELP.md).

## Compatibility

- Companion **4.3 or newer** (built on `@companion-module/base` 2.0.x, Node 22 runtime).
- Companion 4.1 / 4.2 users: the `companion-4x` branch builds the same module on `@companion-module/base` 1.13.

## Develop

Uses Yarn 4 through Corepack, like every Bitfocus module.

```
corepack enable
yarn install
yarn build          # tsc → dist/
yarn lint           # eslint + prettier (Bitfocus config)
yarn package        # companion-module-build → livedeck-studio-<version>.tgz
```

To try a build, point Companion's **Developer modules path** at a folder holding this repository (or unpack the `.tgz` there), or import the `.tgz` under **Modules → Import module package**.

## Studio API notes

- Token: `Authorization: Bearer <token>`, from LiveDeck → Output → Control API. Full docs at `http://<studio>:<port>/api`.
- `GET /api/events` — `text/event-stream`, `event: state` with a compact state on change, `: ping` every 15 s.
- `POST /api/command` — the generic command passthrough the module uses for every action.
- `GET /api/ptz/cameras` — PTZ camera slots per layout, for the PTZ camera dropdowns.
- The Studio advertises `_livedeck-api._tcp` (TXT `role=studio`) so the connection can be picked from the list.

## License

MIT, see [LICENSE](./LICENSE).
