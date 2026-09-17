import { InstanceBase, InstanceStatus, runEntrypoint, type SomeCompanionConfigField } from '@companion-module/base'
import { UpdateActions } from './actions.js'
import { LiveDeckApi, type CompactState } from './api.js'
import { GetConfigFields, type LiveDeckConfig } from './config.js'
import { UpdateFeedbacks } from './feedbacks.js'
import { UpdatePresets } from './presets.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateVariableDefinitions, variableValues } from './variables.js'

export { UpgradeScripts }

/** Companion 4.x build: module SDK 1.x (untyped definition maps, flat presets, runEntrypoint). */
export default class LiveDeckInstance extends InstanceBase<LiveDeckConfig> {
	config!: LiveDeckConfig
	api!: LiveDeckApi
	state: CompactState = {}
	takeStyles: { id: string; name: string }[] = []
	private defSig = ''
	private staleTimer: NodeJS.Timeout | null = null

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: LiveDeckConfig): Promise<void> {
		this.config = config
		this.publishDefinitions()
		this.updateStatus(InstanceStatus.Connecting)
		this.connect()
	}

	async configUpdated(config: LiveDeckConfig): Promise<void> {
		this.config = config
		this.api?.stop()
		this.connect()
	}

	async destroy(): Promise<void> {
		this.api?.stop()
		if (this.staleTimer) { clearInterval(this.staleTimer); this.staleTimer = null }
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	/** The Bonjour picker hands over "address:port"; a typed address is used when nothing was picked. */
	private target(): { host: string; port: number } {
		const b = String(this.config.bonjour_host ?? '')
		const m = b.match(/^\[?([^\]]+?)\]?:(\d+)$/)
		if (m) return { host: m[1], port: Number(m[2]) }
		if (b) return { host: b, port: Number(this.config.port) || 8088 }
		return { host: (this.config.host ?? '').trim(), port: Number(this.config.port) || 8088 }
	}

	private connect(): void {
		const { host, port } = this.target()
		if (!host) { this.updateStatus(InstanceStatus.BadConfig, 'Enter the Studio address or pick it from the list'); return }
		if (!this.config.token) { this.updateStatus(InstanceStatus.BadConfig, 'Enter the API token (Studio → Output → Control API)'); return }
		this.api = new LiveDeckApi(host, port, this.config.token,
			(s) => this.onState(s),
			(ok, msg) => this.updateStatus(ok ? InstanceStatus.Ok : InstanceStatus.ConnectionFailure, msg ?? null),
			(level, msg) => this.log(level, msg))
		this.api.start(!!this.config.poll)
		if (!this.staleTimer) {
			this.staleTimer = setInterval(() => {
				if (this.api && this.api.silentFor() > 40) this.updateStatus(InstanceStatus.Disconnected, 'No word from the Studio for 40 s')
			}, 10000)
		}
	}

	private gotFirstState = false
	private onState(s: CompactState): void {
		if (Array.isArray(s.takeStyles)) this.takeStyles = s.takeStyles
		this.state = s
		if (!this.gotFirstState) {
			this.gotFirstState = true
			this.log('info', `connected to the Studio: ${(s.layouts ?? []).length} layouts, ${(s.audio ?? []).length} audio channels`)
		}
		// Re-publish the definitions only when a choice list changed (layouts, channels, transitions).
		const sig = JSON.stringify([
			(s.layouts ?? []).map((l) => l.id + l.name),
			(s.audio ?? []).map((a) => a.id + a.name),
			this.takeStyles.map((t) => t.id),
		])
		if (sig !== this.defSig) { this.defSig = sig; this.publishDefinitions() }
		this.setVariableValues(variableValues(s))
		this.checkFeedbacks()
	}

	private publishDefinitions(): void {
		UpdateActions(this)
		UpdateFeedbacks(this)
		UpdateVariableDefinitions(this)
		UpdatePresets(this)
	}
}

runEntrypoint(LiveDeckInstance, UpgradeScripts)
