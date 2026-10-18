import { liveNow, type CompactState } from './api.js'
import type LiveDeckInstance from './main.js'

/** Up to this many layouts get a `layout_<n>_name` variable. */
export const LAYOUT_SLOTS = 16

type LayoutNameVars = { [K in `layout_${number}_name`]: string }

export type VariablesSchema = {
	live_layout: string
	cued_layout: string
	live: string
	transition: string
	recording: string
	streaming: string
	ndi_out: string
	cpu: number
	output_fps: number
	health: string
	health_text: string
	offline_count: number
	show: string
	rundown_step: string
	master_gain: string
	quality: string
	orientation: string
	failover: string
	failover_target: string
	layout_count: number
	score_home: number
	score_away: number
	home_name: string
	away_name: string
	home_short: string
	away_short: string
	clock: string
	clock_running: string
	shot: string
	period: number
	period_label: string
	status: string
	sport: string
	game_title: string
	undo_label: string
	bug_on: string
	board_on: string
} & LayoutNameVars

export function UpdateVariableDefinitions(self: LiveDeckInstance): void {
	const defs: Record<string, { name: string }> = {
		live_layout: { name: 'On-air layout name' },
		cued_layout: { name: 'Cued layout name' },
		live: { name: 'GO LIVE: on air (Yes/No)' },
		transition: { name: 'Default transition' },
		recording: { name: 'Recording (Yes/No)' },
		streaming: { name: 'Streaming (Yes/No)' },
		ndi_out: { name: 'NDI output (Yes/No)' },
		cpu: { name: 'Studio CPU %' },
		output_fps: { name: 'Program output fps' },
		health: { name: 'Worst health level (ok/warn/bad)' },
		health_text: { name: 'Health chips, joined' },
		offline_count: { name: 'Layouts with an offline source' },
		show: { name: 'Current show' },
		rundown_step: { name: 'Rundown step (1-based, blank when not running)' },
		master_gain: { name: 'Master gain' },
		quality: { name: 'Program resolution' },
		orientation: { name: 'Program orientation' },
		failover: { name: 'Auto switch-away (On/Off)' },
		failover_target: { name: 'Auto switch-away fallback layout' },
		layout_count: { name: 'Number of layouts' },
	}
	Object.assign(defs, {
		score_home: { name: 'Score: home' },
		score_away: { name: 'Score: away' },
		home_name: { name: 'Score: home team name' },
		away_name: { name: 'Score: away team name' },
		home_short: { name: 'Score: home short name' },
		away_short: { name: 'Score: away short name' },
		clock: { name: 'Score: game clock (7:42, ticks locally)' },
		clock_running: { name: 'Score: game clock running (Yes/No)' },
		shot: { name: 'Score: shot clock' },
		period: { name: 'Score: period number' },
		period_label: { name: 'Score: period label (Q2, 1H, SET 3)' },
		status: { name: 'Score: status (HALF TIME, FINAL, blank in play)' },
		sport: { name: 'Score: sport' },
		game_title: { name: 'Score: game title' },
		undo_label: { name: 'Score: what Undo would take back' },
		bug_on: { name: 'Score: bug on air (Yes/No)' },
		board_on: { name: 'Score: scoreboard on air (Yes/No)' },
	})
	for (let i = 1; i <= LAYOUT_SLOTS; i++) defs[`layout_${i}_name`] = { name: `Layout ${i} name` }
	self.setVariableDefinitions(defs as never)
}

export function variableValues(s: CompactState): Partial<VariablesSchema> {
	const name = (id?: string) => (s.layouts ?? []).find((l) => l.id === id)?.name ?? ''
	const levels = (s.health ?? []).map((h) => h.level)
	const worst = levels.includes('bad') ? 'bad' : levels.includes('warn') ? 'warn' : 'ok'
	const v: Record<string, string | number> = {
		live_layout: name(s.liveLayout),
		cued_layout: name(s.cuedLayout),
		live: liveNow(s) ? 'Yes' : 'No',
		transition: s.takeStyle ?? '',
		recording: s.out?.rec ? 'Yes' : 'No',
		streaming: s.out?.rtmp ? 'Yes' : 'No',
		ndi_out: s.out?.ndi ? 'Yes' : 'No',
		health: worst,
		health_text: (s.health ?? []).map((h) => h.text).join(' · '),
		offline_count: (s.offlineLayouts ?? []).length,
		show: s.currentShow ?? '',
		rundown_step: s.rundownIndex !== undefined && s.rundownIndex >= 0 ? String(s.rundownIndex + 1) : '',
		master_gain: s.master !== undefined ? String(s.master) : '',
		quality: s.quality ?? '',
		orientation: s.portrait ? 'Portrait' : 'Landscape',
		failover: s.failoverOn ? 'On' : 'Off',
		failover_target: s.failoverTarget ? name(s.failoverTarget) : 'Previous layout',
		layout_count: (s.layouts ?? []).length,
	}
	// CPU / fps: the event stream may carry them at the top level, the full state under `stats`,
	// and newer Studios only in the CPU health chip ("CPU 42%"). Unknown → keep the last value.
	const cpuChip = (s.health ?? []).find((h) => h.id === 'cpu')?.text.match(/(\d+(?:\.\d+)?)\s*%/)
	const cpu = s.cpu ?? s.stats?.cpu ?? (cpuChip ? Number(cpuChip[1]) : undefined)
	if (cpu !== undefined && Number.isFinite(Number(cpu))) v.cpu = Math.round(Number(cpu))
	const fps = s.outputFps ?? s.stats?.outputFps
	if (fps !== undefined && Number.isFinite(Number(fps))) v.output_fps = Math.round(Number(fps))
	for (let i = 1; i <= LAYOUT_SLOTS; i++) v[`layout_${i}_name`] = s.layouts?.[i - 1]?.name ?? ''
	return v as Partial<VariablesSchema>
}
