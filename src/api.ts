/**
 * LiveDeck Studio API client: token-gated HTTP commands plus the `/api/events` server-sent
 * event stream (compact state pushed on change, `: ping` every 15 s). Falls back to polling
 * `/api/state` when the stream is not available.
 */
import http from 'node:http'
import type { FundSkin, FundState } from './fund.js'
import type { ScoreBoard, ScoreSkin, ScoreState } from './score.js'

export interface LayoutInfo {
	id: string
	name: string
	type?: string
	live?: boolean
	cued?: boolean
	ptz?: boolean
	skins?: number
	/** Full state only: the PTZ cameras in this layout, with the exact target string for each. */
	ptzCams?: { slot: number; name: string; target: string }[]
}
export interface AudioInfo {
	id: string
	name: string
	gain?: number
	muted?: boolean
	solo?: boolean
	followLayout?: string
}
export interface HealthChip {
	id: string
	level: 'idle' | 'ok' | 'warn' | 'bad'
	text: string
}
export interface CompactState {
	liveLayout?: string
	cuedLayout?: string
	takeStyle?: string
	layouts?: LayoutInfo[]
	offlineLayouts?: string[]
	out?: {
		ndi?: boolean
		rtmp?: boolean
		rec?: boolean
		hls?: boolean
		rtmpSrv?: boolean
		rtmpConnecting?: boolean
		ndiConn?: number
		viewers?: number
	}
	audio?: AudioInfo[]
	master?: number
	audioFollow?: boolean
	health?: HealthChip[]
	failoverOn?: boolean
	failoverTarget?: string
	recAudioState?: string
	portrait?: boolean
	quality?: string
	currentShow?: string
	rundownIndex?: number
	monMuted?: boolean
	cpu?: number
	outputFps?: number
	/** Full state (/api/state): live performance numbers. */
	stats?: { cpu?: number; outputFps?: number; fps?: number }
	takeStyles?: { id: string; name: string }[]
	/** GO LIVE (iOS 2026-09-30+; Android adds it to the event stream later — see liveNow()). */
	isLive?: boolean
	liveSince?: string | number | null
	liveSelection?: {
		ndi?: boolean
		rtmp?: boolean
		facebook?: boolean
		youtube?: boolean
		record?: boolean
		hls?: boolean
		rtmpServer?: boolean
	}
	talkback?: boolean
	talkTarget?: string
	programPtz?: boolean
	programPtzCams?: { slot: number; name: string; target: string }[]
	/** Scoreboard: the full state carries `score`; the event stream sends the same object as `sc`. */
	score?: ScoreState
	sc?: ScoreState
	scoreSkins?: ScoreSkin[]
	scoreBoards?: ScoreBoard[]
	/** Fundraiser: `fund` is the reply object (campaign under `fund.fund`) in the full state and the event stream. */
	fund?: FundState
	fundSkins?: FundSkin[]
	serverNow?: number
	/** #206 one-tap Facebook (Apple TV device-code login; same object as GET /api/facebook). Android: not yet. */
	facebook?: FacebookState
}

export interface FacebookState {
	configured?: boolean
	offered?: boolean
	signedIn?: boolean
	account?: string
	login?: {
		method?: string
		state?: string
		userCode?: string
		url?: string
		qrURL?: string
		expiresIn?: number
		error?: string
	}
	targets?: { id: string; name: string; page: boolean }[]
	target?: { id: string; name: string; page: boolean }
	privacy?: string
	title?: string
	description?: string
	state?: string
	status?: string
	permalink?: string
}

/** GO LIVE state; a Studio that does not report it yet counts as live while any output runs. */
export function liveNow(s: CompactState): boolean {
	if (typeof s.isLive === 'boolean') return s.isLive
	const o = s.out ?? {}
	return !!(o.ndi || o.rtmp || o.rec || o.hls || o.rtmpSrv)
}

export type StateListener = (s: CompactState) => void
export type StatusListener = (ok: boolean, message?: string) => void

export class LiveDeckApi {
	private req: http.ClientRequest | null = null
	private pollTimer: NodeJS.Timeout | null = null
	private reconnectTimer: NodeJS.Timeout | null = null
	private stopped = false
	private lastSeen = 0
	private healthy = false

	constructor(
		public host: string,
		public port: number,
		private token: string,
		private onState: StateListener,
		private onStatus: StatusListener,
		private log: (level: 'info' | 'warn' | 'error' | 'debug', msg: string) => void,
	) {}

	private headers(): Record<string, string> {
		return { Authorization: `Bearer ${this.token}`, Accept: 'application/json' }
	}

	/** The Studio answered: record it, and report OK again after a failure or a stale spell. */
	private alive(): void {
		this.lastSeen = Date.now()
		if (!this.healthy) {
			this.healthy = true
			this.onStatus(true)
		}
	}

	private down(message: string): void {
		this.healthy = false
		this.onStatus(false, message)
	}

	/** Called by the instance when the Studio has been silent too long. */
	markStale(): void {
		this.healthy = false
	}

	/** One HTTP call; resolves the parsed JSON (or the raw text). */
	async request(method: 'GET' | 'POST', path: string, body?: unknown): Promise<unknown> {
		return new Promise((resolve, reject) => {
			const data = body === undefined ? undefined : JSON.stringify(body)
			const r = http.request(
				{
					host: this.host,
					port: this.port,
					path,
					method,
					timeout: 4000,
					headers: {
						...this.headers(),
						...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}),
					},
				},
				(res) => {
					const chunks: Buffer[] = []
					res.on('data', (c) => chunks.push(c))
					res.on('end', () => {
						const text = Buffer.concat(chunks).toString('utf8')
						if ((res.statusCode ?? 500) >= 400)
							return reject(new Error(`HTTP ${res.statusCode} ${path}: ${text.slice(0, 120)}`))
						try {
							resolve(JSON.parse(text))
						} catch {
							resolve(text)
						}
					})
				},
			)
			r.on('timeout', () => {
				r.destroy(new Error('timeout'))
			})
			r.on('error', reject)
			if (data) r.write(data)
			r.end()
		})
	}

	/** The generic command passthrough — the same shape the web remote sends. */
	async command(cmd: Record<string, unknown>): Promise<unknown> {
		return this.request('POST', '/api/command', cmd)
	}

	/** Full state (also carries `takeStyles`, which the compact stream leaves out). */
	async fetchState(): Promise<CompactState> {
		const s = await this.request('GET', '/api/state')
		return s as CompactState
	}

	start(poll: boolean): void {
		this.stopped = false
		void this.fetchState()
			.then((s) => {
				this.alive()
				this.onState(s)
			})
			.catch((e) => this.down(String(e?.message ?? e)))
		if (poll) this.startPolling()
		else this.connectStream()
	}

	stop(): void {
		this.stopped = true
		if (this.req) {
			this.req.destroy()
			this.req = null
		}
		if (this.pollTimer) {
			clearInterval(this.pollTimer)
			this.pollTimer = null
		}
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer)
			this.reconnectTimer = null
		}
	}

	private startPolling(): void {
		if (this.pollTimer) return
		this.pollTimer = setInterval(() => {
			this.fetchState()
				.then((s) => {
					this.alive()
					this.onState(s)
				})
				.catch((e) => this.down(String(e?.message ?? e)))
		}, 2000)
	}

	private connectStream(): void {
		if (this.stopped) return
		const r = http.request(
			{
				host: this.host,
				port: this.port,
				path: '/api/events',
				method: 'GET',
				headers: { ...this.headers(), Accept: 'text/event-stream' },
			},
			(res) => {
				if ((res.statusCode ?? 500) !== 200) {
					this.log('warn', `event stream refused (${res.statusCode}) — polling instead`)
					res.resume()
					this.startPolling()
					return
				}
				this.alive()
				let buf = ''
				res.setEncoding('utf8')
				res.on('data', (chunk: string) => {
					this.alive()
					buf += chunk
					let idx: number
					while ((idx = buf.indexOf('\n\n')) >= 0) {
						const block = buf.slice(0, idx)
						buf = buf.slice(idx + 2)
						const dataLines = block
							.split('\n')
							.filter((l) => l.startsWith('data:'))
							.map((l) => l.slice(5).trim())
						if (!dataLines.length) continue // `: ping`
						try {
							this.onState(JSON.parse(dataLines.join('\n')) as CompactState)
						} catch {
							/* partial */
						}
					}
				})
				res.on('end', () => this.scheduleReconnect('stream ended'))
				res.on('error', (e) => this.scheduleReconnect(String(e.message)))
			},
		)
		r.on('error', (e) => {
			this.down(e.message)
			this.scheduleReconnect(e.message)
		})
		r.end()
		this.req = r
	}

	private scheduleReconnect(why: string): void {
		if (this.stopped) return
		this.log('debug', `event stream: ${why}; reconnecting in 3 s`)
		if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null
			this.connectStream()
		}, 3000)
	}

	/** Seconds since the Studio last spoke — the connection is stale after ~40 s of silence. */
	silentFor(): number {
		return this.lastSeen ? (Date.now() - this.lastSeen) / 1000 : 9999
	}
}
