import { InstanceBase, InstanceStatus, type SomeCompanionConfigField } from '@companion-module/base'
import { UpdateActions, type ActionsSchema } from './actions.js'
import { LiveDeckApi, type CompactState } from './api.js'
import { DEFAULT_PORT, GetConfigFields, type LiveDeckConfig, type LiveDeckSecrets } from './config.js'
import { UpdateFeedbacks, type FeedbacksSchema } from './feedbacks.js'
import { UpdatePresets } from './presets.js'
import { scoreVariableValues, type ScoreBoard, type ScoreSkin, type ScoreState } from './score.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateVariableDefinitions, variableValues, type VariablesSchema } from './variables.js'

export type ModuleSchema = {
	config: LiveDeckConfig
	secrets: LiveDeckSecrets
	actions: ActionsSchema
	feedbacks: FeedbacksSchema
	variables: VariablesSchema
}

type PtzCam = { slot: number; name: string; target: string }

export { UpgradeScripts }

export default class LiveDeckInstance extends InstanceBase<ModuleSchema> {
	config!: LiveDeckConfig
	secrets: LiveDeckSecrets = {}
	api: LiveDeckApi | null = null
	state: CompactState = {}
	takeStyles: { id: string; name: string }[] = []
	/** PTZ cameras per layout and on Program, from GET /api/ptz/cameras (refreshed when the layouts change). */
	ptzLayoutCams = new Map<string, PtzCam[]>()
	ptzProgramCams: PtzCam[] = []
	/** Scoreboard state, kept across partial events (the scorekeeper stream carries `sc` only). */
	score: ScoreState = {}
	scoreSkins: ScoreSkin[] = []
	scoreBoards: ScoreBoard[] = []
	/** Studio wall clock minus ours, from the last `serverNow`; makes the local clock tick right. */
	scoreSkew = 0
	private scoreText: Record<string, string> = {}
	private scoreTimer: NodeJS.Timeout | null = null
	private defSig = ''
	private staleTimer: NodeJS.Timeout | null = null
	private gotFirstState = false

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: LiveDeckConfig, _isFirstInit: boolean, secrets: LiveDeckSecrets): Promise<void> {
		this.config = config
		this.secrets = secrets ?? {}
		this.publishDefinitions()
		this.updateStatus(InstanceStatus.Connecting)
		this.connect()
		this.scoreTimer = setInterval(() => this.tickScore(), 250)
	}

	async configUpdated(config: LiveDeckConfig, secrets: LiveDeckSecrets): Promise<void> {
		this.config = config
		this.secrets = secrets ?? {}
		this.api?.stop()
		this.api = null
		this.gotFirstState = false
		this.updateStatus(InstanceStatus.Connecting)
		this.connect()
	}

	async destroy(): Promise<void> {
		this.api?.stop()
		this.api = null
		if (this.scoreTimer) {
			clearInterval(this.scoreTimer)
			this.scoreTimer = null
		}
		if (this.staleTimer) {
			clearInterval(this.staleTimer)
			this.staleTimer = null
		}
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	/** Send one command to the Studio; failures are logged rather than thrown at Companion. */
	async send(cmd: Record<string, unknown>): Promise<void> {
		if (!this.api) {
			this.log('warn', `Not connected to a Studio — "${String(cmd.action)}" not sent`)
			return
		}
		try {
			await this.api.command(cmd)
		} catch (e) {
			this.log('warn', `"${String(cmd.action)}" failed: ${(e as Error).message}`)
		}
	}

	/**
	 * One scoreboard call (POST /api/score/…). The reply is the whole new score state, so buttons and
	 * variables follow at once instead of waiting for the next event. Failures are logged, not thrown.
	 */
	async scoreCall(path: string): Promise<void> {
		if (!this.api) {
			this.log('warn', `Not connected to a Studio — "${path}" not sent`)
			return
		}
		try {
			const r = (await this.api.request('POST', `/api/score/${path}`)) as ScoreState & { ok?: boolean; error?: string }
			if (r && r.ok === false) {
				this.log('warn', `score ${path} failed: ${r.error ?? 'refused'}`)
				return
			}
			if (r && r.game) this.applyScore(r)
		} catch (e) {
			this.log('warn', `score ${path} failed: ${(e as Error).message}`)
		}
	}

	private applyScore(sc: ScoreState): void {
		this.score = sc
		if (typeof sc.serverNow === 'number') this.scoreSkew = sc.serverNow - Date.now()
		this.pushScoreVars()
		this.checkAllFeedbacks()
	}

	private pushScoreVars(): void {
		const v = scoreVariableValues(this.score, Date.now(), this.scoreSkew, this.scoreSkins)
		this.scoreText = { clock: String(v.clock ?? ''), shot: String(v.shot ?? '') }
		this.setVariableValues(v as never)
	}

	/** ~4 times a second: the clock text is worked out here from the Studio's `ms`/`at`/`run`, nobody streams ticks. */
	private tickScore(): void {
		const g = this.score.game
		if (!g) return
		const v = scoreVariableValues(this.score, Date.now(), this.scoreSkew, this.scoreSkins)
		const changed: Record<string, string> = {}
		for (const k of ['clock', 'shot'] as const) {
			const t = String(v[k] ?? '')
			if (this.scoreText[k] !== t) {
				this.scoreText[k] = t
				changed[k] = t
			}
		}
		if (Object.keys(changed).length) this.setVariableValues(changed)
	}

	/** The Bonjour picker hands over "address:port"; a typed address is used when nothing was picked. */
	private target(): { host: string; port: number } {
		const b = String(this.config.bonjour_host ?? '')
		const m = b.match(/^\[?([^\]]+?)\]?:(\d+)$/)
		if (m) return { host: m[1], port: Number(m[2]) }
		if (b) return { host: b, port: Number(this.config.port) || DEFAULT_PORT }
		return { host: (this.config.host ?? '').trim(), port: Number(this.config.port) || DEFAULT_PORT }
	}

	private token(): string {
		// A config saved by 0.1.x still carries the token until the upgrade script has run.
		return String(this.secrets.token || this.config.token || '').trim()
	}

	private connect(): void {
		const { host, port } = this.target()
		if (!host) {
			this.updateStatus(InstanceStatus.BadConfig, 'Enter the Studio address or pick it from the list')
			return
		}
		const token = this.token()
		if (!token) {
			this.updateStatus(InstanceStatus.BadConfig, 'Enter the API token (LiveDeck → Output → Control API)')
			return
		}
		this.api = new LiveDeckApi(
			host,
			port,
			token,
			(s) => this.onState(s),
			(ok, msg) => this.updateStatus(ok ? InstanceStatus.Ok : InstanceStatus.ConnectionFailure, msg ?? null),
			(level, msg) => this.log(level, msg),
		)
		this.api.start(!!this.config.poll)
		if (!this.staleTimer) {
			this.staleTimer = setInterval(() => {
				if (this.api && this.api.silentFor() > 40) {
					this.api.markStale()
					this.updateStatus(InstanceStatus.Disconnected, 'No word from the Studio for 40 s')
				}
			}, 10000)
		}
	}

	private onState(s: CompactState): void {
		if (Array.isArray(s.takeStyles)) this.takeStyles = s.takeStyles
		// Scoreboard: keep what an event without these keys does not mention.
		const sc = s.score ?? s.sc
		if (typeof s.serverNow === 'number') this.scoreSkew = s.serverNow - Date.now()
		if (sc && sc.game) this.applyScoreQuiet(sc, s.serverNow)
		if (Array.isArray(s.scoreSkins)) this.scoreSkins = s.scoreSkins
		if (Array.isArray(s.scoreBoards)) this.scoreBoards = s.scoreBoards
		this.state = s
		if (!this.gotFirstState) {
			this.gotFirstState = true
			this.log(
				'info',
				`connected to the Studio: ${(s.layouts ?? []).length} layouts, ${(s.audio ?? []).length} audio channels`,
			)
		}
		// Re-publish the definitions only when a choice list changed (layouts, PTZ, channels, transitions).
		const sig = JSON.stringify([
			(s.layouts ?? []).map((l) => [l.id, l.name, !!l.ptz]),
			(s.audio ?? []).map((a) => [a.id, a.name]),
			this.takeStyles.map((t) => t.id),
			this.scoreSkins.map((k) => [k.id, k.name]),
		])
		if (sig !== this.defSig) {
			this.defSig = sig
			this.publishDefinitions()
			void this.refreshPtzCameras()
		}
		this.setVariableValues(variableValues(s))
		this.pushScoreVars()
		this.checkAllFeedbacks()
	}

	private applyScoreQuiet(sc: ScoreState, topNow?: number): void {
		this.score = sc
		const now = typeof sc.serverNow === 'number' ? sc.serverNow : topNow
		if (typeof now === 'number') this.scoreSkew = now - Date.now()
	}

	/** Camera slots for the PTZ dropdowns (split layouts can hold several PTZ cameras). */
	private async refreshPtzCameras(): Promise<void> {
		const api = this.api
		if (!api) return
		try {
			const r = (await api.request('GET', '/api/ptz/cameras')) as {
				layouts?: { id: string; ptzCams?: PtzCam[] }[]
				programPtzCams?: PtzCam[]
			}
			const map = new Map<string, PtzCam[]>()
			for (const l of r.layouts ?? []) if (l.ptzCams && l.ptzCams.length > 1) map.set(l.id, l.ptzCams)
			const prog = (r.programPtzCams ?? []).length > 1 ? (r.programPtzCams ?? []) : []
			const changed =
				JSON.stringify([...map.entries(), prog]) !==
				JSON.stringify([...this.ptzLayoutCams.entries(), this.ptzProgramCams])
			this.ptzLayoutCams = map
			this.ptzProgramCams = prog
			if (changed) UpdateActions(this)
		} catch (e) {
			this.log('debug', `PTZ camera list unavailable: ${(e as Error).message}`)
		}
	}

	private publishDefinitions(): void {
		UpdateActions(this)
		UpdateFeedbacks(this)
		UpdateVariableDefinitions(this)
		UpdatePresets(this)
	}
}
