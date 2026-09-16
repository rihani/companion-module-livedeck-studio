import type { CompactState } from './api.js'
import type LiveDeckInstance from './main.js'

/** Up to this many layouts get a `layout_<n>_name` variable. */
export const LAYOUT_SLOTS = 16

type LayoutNameVars = { [K in `layout_${number}_name`]: string }

export type VariablesSchema = {
	live_layout: string
	cued_layout: string
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
} & LayoutNameVars

export function UpdateVariableDefinitions(self: LiveDeckInstance): void {
	const defs: Record<string, { name: string }> = {
		live_layout: { name: 'On-air layout name' },
		cued_layout: { name: 'Cued layout name' },
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
		transition: s.takeStyle ?? '',
		recording: s.out?.rec ? 'Yes' : 'No',
		streaming: s.out?.rtmp ? 'Yes' : 'No',
		ndi_out: s.out?.ndi ? 'Yes' : 'No',
		cpu: Math.round(Number(s.cpu ?? 0)),
		output_fps: Math.round(Number(s.outputFps ?? 0)),
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
	for (let i = 1; i <= LAYOUT_SLOTS; i++) v[`layout_${i}_name`] = s.layouts?.[i - 1]?.name ?? ''
	return v as Partial<VariablesSchema>
}
