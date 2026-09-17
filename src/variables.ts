import type { CompanionVariableDefinition, CompanionVariableValues } from '@companion-module/base'
import type { CompactState } from './api.js'
import type LiveDeckInstance from './main.js'

/** Up to this many layouts get a `layout_<n>_name` variable. */
export const LAYOUT_SLOTS = 16

export function UpdateVariableDefinitions(self: LiveDeckInstance): void {
	const named: Record<string, string> = {
		live_layout: 'On-air layout name',
		cued_layout: 'Cued layout name',
		transition: 'Default transition',
		recording: 'Recording (Yes/No)',
		streaming: 'Streaming (Yes/No)',
		ndi_out: 'NDI output (Yes/No)',
		cpu: 'Studio CPU %',
		output_fps: 'Program output fps',
		health: 'Worst health level (ok/warn/bad)',
		health_text: 'Health chips, joined',
		offline_count: 'Layouts with an offline source',
		show: 'Current show',
		rundown_step: 'Rundown step (1-based, blank when not running)',
		master_gain: 'Master gain',
		quality: 'Program resolution',
		orientation: 'Program orientation',
		failover: 'Auto switch-away (On/Off)',
		failover_target: 'Auto switch-away fallback layout',
		layout_count: 'Number of layouts',
	}
	for (let i = 1; i <= LAYOUT_SLOTS; i++) named[`layout_${i}_name`] = `Layout ${i} name`
	const defs: CompanionVariableDefinition[] = Object.entries(named).map(([variableId, name]) => ({ variableId, name }))
	self.setVariableDefinitions(defs)
}

export function variableValues(s: CompactState): CompanionVariableValues {
	const name = (id?: string) => (s.layouts ?? []).find((l) => l.id === id)?.name ?? ''
	const levels = (s.health ?? []).map((h) => h.level)
	const worst = levels.includes('bad') ? 'bad' : levels.includes('warn') ? 'warn' : 'ok'
	const v: CompanionVariableValues = {
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
	return v
}
