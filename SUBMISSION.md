# Getting LiveDeck into the Companion module store

The module is ready for submission at **v0.4.0** (tagged and released on rihani/ only, 2026-11-27). Everything below is the owner’s to do, with your own Slack and GitHub logins. Not requested on Slack yet.

## How the store works (checked 2026-10-04)

- Since Companion 4.0, users install modules on demand from the Bitfocus module store. A version appears for everyone once a Bitfocus reviewer approves it. ([Releasing your module](https://companion.free/for-developers/module-development/module-lifecycle/releasing-your-module))
- **First release:** ask for a repository in the `#module-development` channel of the Bitfocus Slack ([invite](https://bfoc.us/ke7e9dqgaz)). Give your GitHub username and the module name in `manufacturer-product` form. The module repo is then hosted in the **bitfocus** GitHub organisation. (same page)
- **Every version:** bump `package.json`, push a git tag `vX.Y.Z`, then on the [Bitfocus Developer Portal](https://developer.bitfocus.io/) (log in with GitHub) go to **My Connections → the module → Submit Version**, pick the tag and press **Submit**. Volunteers review only what is submitted through the portal. (same page)
- The portal builds the tag with Bitfocus's own checks ([bitfocus/actions `module-checks.yaml`](https://github.com/bitfocus/actions/blob/main/.github/workflows/module-checks.yaml)). It fails the build if any of these are wrong: the repo name must be `companion-module-<manifest id>`; `yarn.lock` must exist and `package-lock.json` must not; `@companion-module/tools` must be 3.1.0 or newer; `runtime.apiVersion` must be `0.0.0`; `products` must not be empty; `companion/HELP.md` must exist; the `package.json` version must match the tag; and the packaged `main.js` must load. This repo runs the same checks on every push (`.github/workflows/companion-module-checks.yaml`).
- Manifest rules ([manifest.json](https://companion.free/for-developers/module-development/module-setup/manifest.json)): `id` is the repo name without `companion-module-`; `version` and `runtime.apiVersion` stay `0.0.0` because the build fills them in; licence must be MIT (or GPL); keywords must not repeat the manufacturer or product. The schema requires only `name` for each maintainer, so no email is needed.
- Repo layout, lint and format follow the official TypeScript template ([companion-module-template-ts](https://github.com/bitfocus/companion-module-template-ts)): Yarn 4, eslint + prettier from `@companion-module/tools`, husky + lint-staged, `tsconfig.build.json` and an MIT `LICENSE`. See also [File structure](https://companion.free/for-developers/module-development/module-setup/file-structure), [Code quality](https://companion.free/for-developers/module-development/module-setup/code-quality), [Packaging](https://companion.free/for-developers/module-development/module-lifecycle/module-packaging) and [Licensing](https://companion.free/for-developers/module-development/module-lifecycle/licensing).
- SDK and Companion versions ([API changelog](https://companion.free/for-developers/module-development/api-changes/)): `@companion-module/base` 2.0 needs Companion 4.3 or newer, 2.1 needs 5.0 or newer. This module stays on **2.0.4**, the version the official template pins, so it reaches Companion 4.3+ users as well as 5.x. The newest 2.2.0 is not required by the store.
- Reviewers ask for the module to be tested against the real device, with every action, option and feedback ([Module development 101](https://companion.free/for-developers/module-development/module-development-101)).

## What is ready

| Check                                                                                                                         | Status                         |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Repo name `companion-module-livedeck-studio` = manifest id `livedeck-studio`                                                  | ✅                             |
| `companion/manifest.json`: version 0.0.0, apiVersion 0.0.0, MIT, products, keywords, maintainers, bugs, repository            | ✅                             |
| `companion/HELP.md`: setup, connection fields, actions, feedbacks, variables, presets, troubleshooting, link to manarlabs.com | ✅                             |
| `LICENSE` (MIT, © 2026 Manar Labs)                                                                                            | ✅                             |
| Yarn 4 + `yarn.lock`, no `package-lock.json`                                                                                  | ✅                             |
| `@companion-module/tools` 3.1.1, eslint / prettier / husky / lint-staged as in the template                                   | ✅                             |
| `yarn build` (tsc type check) and `yarn lint`                                                                                 | ✅ clean                       |
| `yarn package`, then the store's launch check (export is a function)                                                          | ✅ `livedeck-studio-0.2.0.tgz` |
| API token stored as a secret (`secret-text`), upgrade script moves 0.1.x tokens                                               | ✅ tested                      |
| Loaded in Companion 5.0.5 (Docker) against a LiveDeck Studio (iOS Simulator)                                                  | ✅ see "Test record"           |

Packaged module (git-ignored, rebuild with `yarn package`):
`/Users/studio1/Developer/companion-module-livedeck/livedeck-studio-0.2.0.tgz`
You don't upload it to the store, because the portal builds from the tag. It is for **Modules → Import module package** in a local Companion.

## Steps for the owner

### 1. Ask for the repository on Slack

Join the Bitfocus Slack (<https://bfoc.us/ke7e9dqgaz>) and post in **#module-development**:

> Hi! I'd like to publish a new connection module for **LiveDeck**, a vision mixer app for iPad / iPhone / Mac / Android by Manar Labs (https://manarlabs.com/apps/livedeck/).
> GitHub username: **rihani**
> Module name: **livedeck-studio** (`companion-module-livedeck-studio`)
> The code is ready at https://github.com/rihani/companion-module-livedeck-studio (MIT, SDK 2.0.4, built from the TS template, passes the module-checks workflow). Happy to transfer that repo into the bitfocus org, or push it into a new one, whichever you prefer.

### 2. Move the code into the bitfocus repo

Once a maintainer replies, do one of these:

- **They create `bitfocus/companion-module-livedeck-studio` and add you:**
  ```
  cd ~/Developer/companion-module-livedeck
  git remote add bitfocus https://github.com/bitfocus/companion-module-livedeck-studio.git
  git push bitfocus main
  ```
- **They ask you to transfer it:** on GitHub, open rihani/companion-module-livedeck-studio → Settings → Danger Zone → Transfer → `bitfocus`. GitHub redirects the old URL.

Then point the URLs at the new home and commit:

```
cd ~/Developer/companion-module-livedeck
sed -i '' 's#github.com/rihani/companion-module-livedeck-studio#github.com/bitfocus/companion-module-livedeck-studio#g' companion/manifest.json package.json companion/HELP.md README.md
git commit -am "Point repository URLs at the bitfocus org"
git push   # to the bitfocus remote
```

### 3. Tag the release

The tag must match `package.json` (`0.4.0`):

```
git tag v0.4.0
git push bitfocus v0.4.0
```

A GitHub Release is optional. The portal only needs the tag.

### 4. Submit on the Developer Portal

<https://developer.bitfocus.io/> → **Log in with GitHub** (as rihani) → **My Connections** → **livedeck-studio** → **Submit Version**:

| Field         | Value                                 |
| ------------- | ------------------------------------- |
| Git tag       | `v0.4.0`                              |
| Is prerelease | unchecked (check it for a beta build) |

Then press **Submit**. If the portal asks for module details, it takes them from the manifest. If any field has to be typed, use these:

| Field          | Value                                                                                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Module id      | `livedeck-studio`                                                                                                                                                                                                        |
| Name           | `LiveDeck`                                                                                                                                                                                                               |
| Manufacturer   | `Manar Labs`                                                                                                                                                                                                             |
| Products       | `LiveDeck`                                                                                                                                                                                                               |
| Description    | Control the LiveDeck vision mixer (iPad, iPhone, Mac, Android): take and cue layouts, GO LIVE, transitions, recording, NDI / RTMP / HLS outputs, PTZ presets, audio, Run a Show and talkback, with live button feedback. |
| Keywords       | NDI, switcher, video mixer, vision mixer, PTZ, live streaming, RTMP, recording, talkback, iPad, Android                                                                                                                  |
| Licence        | MIT                                                                                                                                                                                                                      |
| Maintainer     | rihani (GitHub)                                                                                                                                                                                                          |
| Help / website | https://manarlabs.com/apps/livedeck/                                                                                                                                                                                     |
| Issues         | https://github.com/bitfocus/companion-module-livedeck-studio/issues (after the move)                                                                                                                                     |

### 5. Review

Answer reviewer comments on the portal. For each fix: change the code, bump `version` in `package.json` (for example 0.2.1), tag `v0.2.1`, then **Submit Version** again. Once approved, LiveDeck shows up under **Connections → Add connection** in every Companion 4.3+ install.

## Only the owner can do these

- Join the Bitfocus Slack and post the request (your account).
- Log in to the Developer Portal with your GitHub account, and accept any terms it shows on first login. The docs mention no separate licence agreement. The module licence is MIT.
- Accept the repo invitation or transfer, push the tag, and press Submit.
- Confirm three choices I made for you (each can still change before the first approval):
  1. **Manufacturer "Manar Labs", product "LiveDeck"**, with the id kept as `livedeck-studio` (the published repo name). The alternative is manufacturer "LiveDeck" with product "Studio".
  2. **Maintainer listed as GitHub `rihani`, with no email.**
  3. **LICENSE copyright "Manar Labs".**

## Optional: Companion 4.1 / 4.2 users

SDK 2.0 needs Companion 4.3 or newer. The `companion-4x` branch builds the 0.1.0 feature set on `@companion-module/base` 1.13.6 for Companion 4.1 and 4.2. The store can also serve that build: bring the branch up to the same repo layout (yarn, LICENSE, checks), tag it `v0.1.1`, and submit it. Companion offers each user the newest version their install supports.

## Test record (2026-10-04)

All tests ran against a Docker Companion 5.0.5 (`ghcr.io/bitfocus/companion/companion:v5.0.5`, admin on :8001), with the packaged 0.2.0 module loaded from the extra-module path. The Studio was LiveDeck build 383 (Debug) in the iOS Simulator, with the web remote moved to port 8095 by the `-webPort` launch argument.

- The connection went to OK over the event stream and logged "connected to the Studio: 1 layouts".
- Variables (`live_layout`, `cued_layout`, `live`, `cpu`, `health`, `layout_1_name`, …) read back through `/api/variable/…`.
- 16 presets were placed on page 1 and pressed through the HTTP API. The Studio state changed for each: Take layout, Cue, Cut, NDI on/off, GO LIVE selection toggle, **GO LIVE** (record started; RTMP with no server reported a failure, as designed), **Stop needs the 2 s hold** (a short press did nothing, a 2.6 s hold stopped), and Talk hold (`talkback` true while held, false on release). PTZ recall, move, zoom and Show Next were accepted with no warnings. The simulator has no PTZ camera, so camera motion itself is not tested.
- Button renders matched the feedbacks: on air red, cued green, recording with no audio amber, GO LIVE output ticked blue, health bad red.
- Bad token gave _Connection Failure: HTTP 401 … invalid or missing API token_. Empty token gave _Bad Configuration_. A closed port gave _ECONNREFUSED_. Poll mode was OK. A failed command logged a `warn` line, which shows the clean runs above really had no failures.
- Upgrade: a connection saved by the released 0.1.0 package (token in the plain config) restarted on 0.2.0 with the token moved into the secrets. `lastUpgradeIndex` went to 0 and the connection stayed OK.

### Studio-side notes (LiveDeck app, not this module)

- **Android** `WebControl.kt` `COMPACT_KEYS` is missing `isLive`, `liveSince` and `liveSelection`, which iOS sends. On Android the module treats the Studio as live when any output is running. The "GO LIVE: output is ticked" feedback stays off until those keys are added.
- **iOS** compact event stream: `cpu` / `outputFps` are no longer filled, because `/api/state` now has `stats.cpu` and an empty `debug.cpu`. This was seen in the simulator. Android's `compact()` uses the same `debug.cpu` lookup and should be checked. The module reads CPU from the CPU health chip instead, and `output_fps` updates only from the full state.
