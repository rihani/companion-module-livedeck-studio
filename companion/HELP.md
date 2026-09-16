# LiveDeck Studio

Controls a LiveDeck Studio running on an iPad, iPhone or Android device over its control API.

## Setup on the Studio

1. Output tab → **Web remote** → switch it on.
2. Output tab → **Control API** → copy the API token (regenerate it there if it was ever shared).
3. Keep LiveDeck in the foreground while you use the surface — iOS closes the listener when the app is in the background.

## Connection

- **Studio**: pick the Studio found on the network, or enter its address and port (8088 for iOS, 8090 for Android).
- **API token**: the token from the Control API card.

The module listens to the Studio's event stream, so button colours follow the mixer within a frame. If the stream is unavailable it polls every two seconds.

## Actions

Cue layout · Take layout (own or chosen transition) · Take cued · Cut · Default transition · Record · NDI output · Stream (RTMP) · HLS pull · Mute / Solo / Fader / Master · Audio follow / manual · Run a Show start / next / step / end · Talkback (hold) · Message to satellites · Program resolution and orientation · Auto switch-away and its fallback layout.

## Feedbacks

Layout on air · Layout cued · Layout source offline · Recording · Streaming · NDI output on · Channel muted / soloed · Program health warning · Auto switch-away on · Audio follows Program.

## Variables

Live and cued layout names, transition, recording / streaming / NDI state, CPU, output fps, program health, offline source count, current show and rundown step, master gain, and one variable per layout name.

## Presets

One button per layout (take, with on-air / cued / offline colours), plus Take, Cut, Record, Stream, NDI, Show Next, Talk (hold) and Auto switch-away.
