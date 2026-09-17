import type { CompanionPresetDefinitions } from '@companion-module/base'
import { AMBER, BLACK, BLUE, GREEN, RED, WHITE } from './feedbacks.js'
import type LiveDeckInstance from './main.js'

const DARK = 0x0e1730

export function UpdatePresets(self: LiveDeckInstance): void {
	const p: CompanionPresetDefinitions = {}
		for (const l of self.state.layouts ?? []) {
		const tid = `take_${l.id}`, cid = `cue_${l.id}`
		p[tid] = {
			type: 'button', category: 'Layouts: take', name: `Take ${l.name}`,
			style: { text: l.name, size: 'auto', color: WHITE, bgcolor: DARK },
			steps: [{ down: [{ actionId: 'layout_take', options: { layout: l.id, style: '' } }], up: [] }],
			feedbacks: [
				{ feedbackId: 'layout_cued', options: { layout: l.id }, style: { bgcolor: GREEN, color: BLACK } },
				{ feedbackId: 'layout_live', options: { layout: l.id }, style: { bgcolor: RED, color: WHITE } },
				{ feedbackId: 'layout_offline', options: { layout: l.id }, style: { bgcolor: AMBER, color: BLACK, text: `${l.name}\nOFFLINE` } },
			],
		}
		p[cid] = {
			type: 'button', category: 'Layouts: cue', name: `Cue ${l.name}`,
			style: { text: `CUE\n${l.name}`, size: 'auto', color: WHITE, bgcolor: DARK },
			steps: [{ down: [{ actionId: 'layout_cue', options: { layout: l.id } }], up: [] }],
			feedbacks: [{ feedbackId: 'layout_cued', options: { layout: l.id }, style: { bgcolor: GREEN, color: BLACK } }],
		}
	}
	p.take = { type: 'button', category: 'Switching', name: 'Take', style: { text: 'TAKE', size: '24', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId: 'take', options: { style: '' } }], up: [] }], feedbacks: [] }
	p.cut = { type: 'button', category: 'Switching', name: 'Cut', style: { text: 'CUT', size: '24', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId: 'cut', options: {} }], up: [] }], feedbacks: [] }
	p.record = { type: 'button', category: 'Outputs', name: 'Record', style: { text: 'REC', size: '24', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId: 'record', options: { mode: 'toggle' } }], up: [] }],
		feedbacks: [
			{ feedbackId: 'recording', options: {}, style: { bgcolor: RED, color: WHITE } },
			{ feedbackId: 'rec_silent', options: {}, style: { bgcolor: AMBER, color: BLACK, text: 'REC\nNO AUDIO' } },
		] }
	p.stream = { type: 'button', category: 'Outputs', name: 'Stream', style: { text: 'STREAM', size: '18', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId: 'stream', options: { mode: 'toggle' } }], up: [] }],
		feedbacks: [
			{ feedbackId: 'stream_connecting', options: {}, style: { bgcolor: AMBER, color: BLACK } },
			{ feedbackId: 'streaming', options: {}, style: { bgcolor: GREEN, color: BLACK } },
		] }
	p.ndi = { type: 'button', category: 'Outputs', name: 'NDI output', style: { text: 'NDI', size: '24', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId: 'ndi_out', options: { mode: 'toggle' } }], up: [] }],
		feedbacks: [{ feedbackId: 'ndi_out', options: {}, style: { bgcolor: GREEN, color: BLACK } }] }
	p.show_start = { type: 'button', category: 'Run a Show', name: 'Start show', style: { text: 'START\nSHOW', size: '18', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId: 'show_start', options: { record: true, stream: true } }], up: [] }], feedbacks: [] }
	p.show_next = { type: 'button', category: 'Run a Show', name: 'Next step', style: { text: 'NEXT\n$(livedeck:rundown_step)', size: '18', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId: 'show_next', options: {} }], up: [] }], feedbacks: [] }
	p.show_end = { type: 'button', category: 'Run a Show', name: 'End show', style: { text: 'END\nSHOW', size: '18', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId: 'show_end', options: {} }], up: [] }], feedbacks: [] }
	p.talk = { type: 'button', category: 'Satellites', name: 'Talk (hold)', style: { text: 'TALK', size: '24', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId: 'talk', options: { mode: 'on' } }], up: [{ actionId: 'talk', options: { mode: 'off' } }] }], feedbacks: [] }
	p.failover = { type: 'button', category: 'Status & settings', name: 'Auto switch-away', style: { text: 'AUTO\nSWITCH', size: '14', color: WHITE, bgcolor: DARK },
		steps: [{ down: [{ actionId: 'failover', options: { mode: 'toggle' } }], up: [] }],
		feedbacks: [{ feedbackId: 'failover_on', options: {}, style: { bgcolor: BLUE, color: WHITE } }] }
	p.health = { type: 'button', category: 'Status & settings', name: 'Health', style: { text: 'CPU $(livedeck:cpu)%\n$(livedeck:health)', size: '14', color: WHITE, bgcolor: DARK },
		steps: [{ down: [], up: [] }],
		feedbacks: [
			{ feedbackId: 'health_warn', options: {}, style: { bgcolor: AMBER, color: BLACK } },
			{ feedbackId: 'health_bad', options: {}, style: { bgcolor: RED, color: WHITE } },
		] }
	p.on_air = { type: 'button', category: 'Status & settings', name: 'On air', style: { text: 'ON AIR\n$(livedeck:live_layout)', size: '14', color: WHITE, bgcolor: DARK },
		steps: [{ down: [], up: [] }], feedbacks: [] }

	self.setPresetDefinitions(p)
}
