/**
 * LiveDeck Studio API client: token-gated HTTP commands plus the `/api/events` server-sent
 * event stream (compact state pushed on change, `: ping` every 15 s). Falls back to polling
 * `/api/state` when the stream is not available.
 */
import http from 'node:http'

export interface LayoutInfo {
	id: string
	name: string
	type?: string
	live?: boolean
	cued?: boolean
	ptz?: boolean
	skins?: number
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
	out?: { ndi?: boolean; rtmp?: boolean; rec?: boolean; hls?: boolean; rtmpSrv?: boolean; rtmpConnecting?: boolean; ndiConn?: number; viewers?: number }
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
	takeStyles?: { id: string; name: string }[]
}

export type StateListener = (s: CompactState) => void
export type StatusListener = (ok: boolean, message?: string) => void

export class LiveDeckApi {
	private req: http.ClientRequest | null = null
	private pollTimer: NodeJS.Timeout | null = null
	private reconnectTimer: NodeJS.Timeout | null = null
	private stopped = false
	private lastSeen = 0

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

	/** One HTTP call; resolves the parsed JSON (or the raw text). */
	request(method: 'GET' | 'POST', path: string, body?: unknown): Promise<any> {
		return new Promise((resolve, reject) => {
			const data = body === undefined ? undefined : JSON.stringify(body)
			const r = http.request(
				{ host: this.host, port: this.port, path, method, timeout: 4000,
					headers: { ...this.headers(), ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}) } },
				(res) => {
					const chunks: Buffer[] = []
					res.on('data', (c) => chunks.push(c))
					res.on('end', () => {
						const text = Buffer.concat(chunks).toString('utf8')
						if ((res.statusCode ?? 500) >= 400) return reject(new Error(`HTTP ${res.statusCode} ${path}: ${text.slice(0, 120)}`))
						try { resolve(JSON.parse(text)) } catch { resolve(text) }
					})
				},
			)
			r.on('timeout', () => { r.destroy(new Error('timeout')) })
			r.on('error', reject)
			if (data) r.write(data)
			r.end()
		})
	}

	/** The generic command passthrough — the same shape the web remote sends. */
	command(cmd: Record<string, unknown>): Promise<any> {
		return this.request('POST', '/api/command', cmd)
	}

	/** Full state (also carries `takeStyles`, which the compact stream leaves out). */
	async fetchState(): Promise<CompactState> {
		const s = await this.request('GET', '/api/state')
		return s as CompactState
	}

	start(poll: boolean): void {
		this.stopped = false
		void this.fetchState().then((s) => { this.lastSeen = Date.now(); this.onStatus(true); this.onState(s) })
			.catch((e) => this.onStatus(false, String(e?.message ?? e)))
		if (poll) this.startPolling()
		else this.connectStream()
	}

	stop(): void {
		this.stopped = true
		if (this.req) { this.req.destroy(); this.req = null }
		if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null }
		if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null }
	}

	private startPolling(): void {
		if (this.pollTimer) return
		this.pollTimer = setInterval(() => {
			this.fetchState().then((s) => { this.lastSeen = Date.now(); this.onStatus(true); this.onState(s) })
				.catch((e) => this.onStatus(false, String(e?.message ?? e)))
		}, 2000)
	}

	private connectStream(): void {
		if (this.stopped) return
		const r = http.request({ host: this.host, port: this.port, path: '/api/events', method: 'GET',
			headers: { ...this.headers(), Accept: 'text/event-stream' } }, (res) => {
			if ((res.statusCode ?? 500) !== 200) {
				this.log('warn', `event stream refused (${res.statusCode}) — polling instead`)
				res.resume(); this.startPolling(); return
			}
			this.onStatus(true)
			let buf = ''
			res.setEncoding('utf8')
			res.on('data', (chunk: string) => {
				this.lastSeen = Date.now()
				buf += chunk
				let idx: number
				while ((idx = buf.indexOf('\n\n')) >= 0) {
					const block = buf.slice(0, idx); buf = buf.slice(idx + 2)
					const dataLines = block.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim())
					if (!dataLines.length) continue   // `: ping`
					try { this.onState(JSON.parse(dataLines.join('\n')) as CompactState) } catch { /* partial */ }
				}
			})
			res.on('end', () => this.scheduleReconnect('stream ended'))
			res.on('error', (e) => this.scheduleReconnect(String(e.message)))
		})
		r.on('error', (e) => { this.onStatus(false, e.message); this.scheduleReconnect(e.message) })
		r.end()
		this.req = r
	}

	private scheduleReconnect(why: string): void {
		if (this.stopped) return
		this.log('debug', `event stream: ${why}; reconnecting in 3 s`)
		if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
		this.reconnectTimer = setTimeout(() => { this.reconnectTimer = null; this.connectStream() }, 3000)
	}

	/** Seconds since the Studio last spoke — the connection is stale after ~40 s of silence. */
	silentFor(): number { return this.lastSeen ? (Date.now() - this.lastSeen) / 1000 : 9999 }
}
