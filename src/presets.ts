import type { CompanionPresetDefinitions, CompanionPresetSection } from '@companion-module/base'
import { AMBER, BLACK, BLUE, GREEN, RED, WHITE } from './feedbacks.js'
import type LiveDeckInstance from './main.js'
import type { ModuleSchema } from './main.js'

const DARK = 0x0e1730

export function UpdatePresets(self: LiveDeckInstance): void {
	const p: CompanionPresetDefinitions<ModuleSchema> = {}
	const takeIds: string[] = [], cueIds: string[] = []
	for (const l of self.state.layouts ?? []) {
		const tid = `take_${l.id}`, cid = `cue_${l.id}`
		takeIds.push(tid); cueIds.push(cid)
		p[tid] = {
			type: 'simple', name: `Take ${l.name}`,
			style: { text: l.name, size: 'auto', color: WHITE, bgcolor: DARK },
			steps: [{ down: [{ actionId: 'layout_take', options: { layout: l.id, style: '' } }], up: [] }],
			feedbacks: [
				{ feedbackId: 'layout_cued', options: { layout: l.id }, style: { bgcolor: GREEN, color: BLACK } },
				{ feedbackId: 'layout_live', options: { layout: l.id }, style: { bgcolor: RED, color: WHITE } },
				{ feedbackId: 'layout_offline', options: { layout: l.id }, style: { bgcolor: AMBER, color: BLACK, text: `${l.name}\nOFFLINE` } },
			],
		}
		p[cid] = {
			type: 'simple', name: `Cue ${l.name}`,
			style: { text: `CUE\n${l.name}`, size: 'auto', color: WHITE, bgcolor: DARK },
			steps: [{ down: [{ actionId: 'layout_cue', options: { layout: l.id } }], up: [] }],
			feedbacks: [{ feedbackId: 'layout_cued', options: { layout: l.id }, style: { bgcolor: GREEN, color: BLACK } }],
		}
	}
	p.take = { type: 'simple', name: 'Take', style: { text: 'TAKE', size: '24', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId: 'take', options: { style: '' } }], up: [] }], feedbacks: [] }
	p.cut = { type: 'simple', name: 'Cut', style: { text: 'CUT', size: '24', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId: 'cut', options: {} }], up: [] }], feedbacks: [] }
	p.record = { type: 'simple', name: 'Record', style: { text: 'REC', size: '24', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId: 'record', options: { mode: 'toggle' } }], up: [] }],
		feedbacks: [
			{ feedbackId: 'recording', options: {}, style: { bgcolor: RED, color: WHITE } },
			{ feedbackId: 'rec_silent', options: {}, style: { bgcolor: AMBER, color: BLACK, text: 'REC\nNO AUDIO' } },
		] }
	p.stream = { type: 'simple', name: 'Stream', style: { text: 'STREAM', size: '18', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId: 'stream', options: { mode: 'toggle' } }], up: [] }],
		feedbacks: [
			{ feedbackId: 'stream_connecting', options: {}, style: { bgcolor: AMBER, color: BLACK } },
			{ feedbackId: 'streaming', options: {}, style: { bgcolor: GREEN, color: BLACK } },
		] }
	p.ndi = { type: 'simple', name: 'NDI output', style: { text: 'NDI', size: '24', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId: 'ndi_out', options: { mode: 'toggle' } }], up: [] }],
		feedbacks: [{ feedbackId: 'ndi_out', options: {}, style: { bgcolor: GREEN, color: BLACK } }] }
	p.show_start = { type: 'simple', name: 'Start show', style: { text: 'START\nSHOW', size: '18', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId: 'show_start', options: { record: true, stream: true } }], up: [] }], feedbacks: [] }
	p.show_next = { type: 'simple', name: 'Next step', style: { text: 'NEXT\n$(livedeck:rundown_step)', size: '18', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId: 'show_next', options: {} }], up: [] }], feedbacks: [] }
	p.show_end = { type: 'simple', name: 'End show', style: { text: 'END\nSHOW', size: '18', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId: 'show_end', options: {} }], up: [] }], feedbacks: [] }
	p.talk = { type: 'simple', name: 'Talk (hold)', style: { text: 'TALK', size: '24', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId: 'talk', options: { mode: 'on' } }], up: [{ actionId: 'talk', options: { mode: 'off' } }] }], feedbacks: [] }
	p.failover = { type: 'simple', name: 'Auto switch-away', style: { text: 'AUTO\nSWITCH', size: '14', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId: 'failover', options: { mode: 'toggle' } }], up: [] }],
		feedbacks: [{ feedbackId: 'failover_on', options: {}, style: { bgcolor: BLUE, color: WHITE } }] }
	p.health = { type: 'simple', name: 'Health', style: { text: 'CPU $(livedeck:cpu)%\n$(livedeck:health)', size: '14', color: WHITE, bgcolor: DARK },
		steps: [{ down: [], up: [] }],
		feedbacks: [
			{ feedbackId: 'health_warn', options: {}, style: { bgcolor: AMBER, color: BLACK } },
			{ feedbackId: 'health_bad', options: {}, style: { bgcolor: RED, color: WHITE } },
		] }
	p.on_air = { type: 'simple', name: 'On air', style: { text: 'ON AIR\n$(livedeck:live_layout)', size: '14', color: WHITE, bgcolor: DARK },
		steps: [{ down: [], up: [] }], feedbacks: [] }

	const structure: CompanionPresetSection<ModuleSchema>[] = [
		{ id: 'layouts', name: 'Layouts', definitions: [
			{ id: 'take', type: 'simple', name: 'Take to Program', description: 'One button per layout: green when cued, red on air, amber when its source dropped.', presets: takeIds },
			{ id: 'cue', type: 'simple', name: 'Cue', presets: cueIds },
		] },
		{ id: 'switching', name: 'Switching', definitions: [{ id: 'sw', type: 'simple', name: 'Take / Cut', presets: ['take', 'cut'] }] },
		{ id: 'outputs', name: 'Outputs', definitions: [{ id: 'out', type: 'simple', name: 'Record / Stream / NDI', presets: ['record', 'stream', 'ndi'] }] },
		{ id: 'show', name: 'Run a Show', definitions: [{ id: 'show', type: 'simple', name: 'Show control', presets: ['show_start', 'show_next', 'show_end'] }] },
		{ id: 'satellites', name: 'Satellites', definitions: [{ id: 'sat', type: 'simple', name: 'Talkback', presets: ['talk'] }] },
		{ id: 'status', name: 'Status & settings', definitions: [{ id: 'st', type: 'simple', name: 'Status', presets: ['on_air', 'health', 'failover'] }] },
	]
	self.setPresetDefinitions(structure, p)
}
