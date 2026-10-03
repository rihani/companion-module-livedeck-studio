## LiveDeck

Controls **LiveDeck**, the vision mixer for iPad, iPhone, Mac and Android, over its control API. Buttons follow the mixer live: on-air and cued layouts, GO LIVE, recording, streaming and more.

More about LiveDeck: [manarlabs.com/apps/livedeck](https://manarlabs.com/apps/livedeck/)

### Set up LiveDeck

1. Open LiveDeck in **Studio** mode.
2. **Output → Web remote**: switch it on. The card shows the address and port, for example `http://192.168.1.20:8088`.
3. **Output → Control API**: copy the **API token**. If the token was ever shared, regenerate it there; every surface using the old one is signed out.
4. Keep LiveDeck in the foreground while you use Companion. iOS and iPadOS close the network listener when the app is in the background.

### Set up the connection in Companion

| Field                      | What to enter                                                                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Studio on this network** | Pick the Studio from the list. LiveDeck advertises itself over Bonjour (`_livedeck-api._tcp`).                                                                                             |
| **Address / Port**         | Or type the address and port shown on the Web remote card. The default port is **8088** on iPad / iPhone / Mac and **8090** on Android. If you changed the port in LiveDeck, use that one. |
| **API token**              | The token from Output → Control API. It is stored as a secret and is not included in exported configs.                                                                                     |
| **Poll every 2 s**         | Leave this off. The module listens to the Studio's event stream, so buttons update straight away. Turn it on only if a proxy or firewall blocks long-lived connections.                    |

### Actions

- **Switching:** Cue layout, Take layout to Program (with its own or a chosen transition), Take (cued to Program), Cut, Set default transition.
- **GO LIVE:** GO LIVE / stop (starts or stops every output ticked for GO LIVE, together), GO LIVE: choose what it starts.
- **Outputs:** Record, Stream (RTMP push), NDI output, HLS pull server. Each can be set to On, Off or Toggle.
- **PTZ:** Recall preset, Store preset, Pan / tilt (eight directions plus Stop, with a speed), Zoom in / out / stop. The camera is the on-air PTZ camera, a layout's first PTZ camera, or a specific slot (`program:1`, `<layoutId>:2`) in split layouts.
- **Audio:** Mute channel, Solo channel, Channel fader, Master fader, Audio follows Program / manual, Monitor audio (the device speaker).
- **Run a Show:** Start (optionally recording and streaming), Next step, Go to step, End.
- **Talkback and satellites:** Talkback on / off (hold to talk), Who hears talkback (the satellite on air, all satellites, or one satellite), Message the satellites.
- **Program:** Program resolution (480p / 720p / 1080p), Program orientation (landscape / portrait), Auto switch-away when the on-air source drops, and its fallback layout.
- **Raw command (advanced):** any command from the Studio's API docs page (`http://<studio>:<port>/api`), as JSON.

### Feedbacks

Layout is on air · Layout is cued · Layout has a source that stopped sending · GO LIVE: on air · GO LIVE: output is ticked · Recording · Recording with no audio · Streaming · Stream connecting · NDI output on · HLS pull server on · Channel muted · Channel soloed · Audio follows Program · Program health: warning or worse · Program health: bad · Auto switch-away is on.

### Variables

| Variable                                           | Meaning                                           |
| -------------------------------------------------- | ------------------------------------------------- |
| `live_layout`, `cued_layout`                       | Names of the on-air and cued layouts              |
| `live`                                             | GO LIVE on air (Yes / No)                         |
| `recording`, `streaming`, `ndi_out`                | Output state (Yes / No)                           |
| `transition`                                       | Default transition                                |
| `cpu`, `output_fps`                                | Studio CPU % and Program output frame rate        |
| `health`, `health_text`, `offline_count`           | Worst health level, health chips, offline layouts |
| `show`, `rundown_step`                             | Current show and rundown step (1-based)           |
| `master_gain`, `quality`, `orientation`            | Master gain, Program resolution and orientation   |
| `failover`, `failover_target`                      | Auto switch-away and its fallback layout          |
| `layout_count`, `layout_1_name` … `layout_16_name` | Number of layouts and each layout's name          |

### Presets

- **GO LIVE:** GO LIVE (red **● LIVE** while on air), Stop (hold for 2 seconds so it can't be pressed by accident), and one button per output to choose what GO LIVE starts.
- **Layouts:** one Take button and one Cue button per layout. Green = cued, red = on air, amber = a source in that layout stopped sending. These appear once the connection is up.
- **Switching:** Take, Cut.
- **Outputs:** Record (amber if recording with no audio), Stream (amber while connecting), NDI, HLS.
- **PTZ:** Presets 1–8 on the on-air camera (tap to recall, hold 2 s to store), pan / tilt arrows and zoom (move while held, stop on release).
- **Run a Show:** Start, Next (shows the step number), End.
- **Talkback:** Talk (hold), Talk to the satellite on air, Talk to all satellites.
- **Status:** On air (layout name), Health (CPU and health level), Auto switch-away.

### Troubleshooting

- **Connection failure, "invalid or missing API token":** copy the token again from Output → Control API. A regenerated token signs out every surface using the old one.
- **Connection failure, timeout or "ECONNREFUSED":** check that Web remote is on, the address and port match the Web remote card, and Companion and LiveDeck are on the same network (VLANs and guest Wi-Fi often block device-to-device traffic). Try opening `http://<address>:<port>` in a browser on the Companion machine.
- **"No word from the Studio for 40 s":** LiveDeck went to the background or the device slept. Bring LiveDeck back to the foreground. The module reconnects by itself.
- **The Studio is missing from the list:** Bonjour does not cross subnets or some Wi-Fi setups. Type the address and port instead.
- **Layout presets or dropdowns are empty:** they are filled from the Studio once connected. Add or rename layouts in LiveDeck and they update by themselves.
- **PTZ does nothing:** the target layout must hold a PTZ-capable NDI camera. "Program" means the camera on air right now. Use a layout id or `layoutId:slot` for a fixed camera.
- **GO LIVE starts nothing:** tick the outputs for GO LIVE in LiveDeck (or with the "What GO LIVE starts" presets). An RTMP stream with no server set is skipped and the rest still start.

Support and bug reports: [github.com/rihani/companion-module-livedeck-studio/issues](https://github.com/rihani/companion-module-livedeck-studio/issues)
