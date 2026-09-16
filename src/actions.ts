import type { DropdownChoice } from '@companion-module/base'
import type LiveDeckInstance from './main.js'

type OnOff = 'toggle' | 'on' | 'off'

export type ActionsSchema = {
	layout_cue: { options: { layout: string } }
	layout_take: { options: { layout: string; style: string } }
	take: { options: { style: string } }
	cut: { options: Record<string, never> }
	transition_default: { options: { style: string } }
	record: { options: { mode: OnOff } }
	stream: { options: { mode: OnOff } }
	ndi_out: { options: { mode: OnOff } }
	hls: { options: { mode: OnOff } }
	audio_mute: { options: { channel: string; mode: OnOff } }
	audio_solo: { options: { channel: string; mode: OnOff } }
	audio_gain: { options: { channel: string; gain: number } }
	master_gain: { options: { gain: number } }
	audio_follow: { options: { mode: 'follow' | 'manual' } }
	show_start: { options: { record: boolean; stream: boolean } }
	show_next: { options: Record<string, never> }
	show_step: { options: { index: number } }
	show_end: { options: Record<string, never> }
	talk: { options: { mode: 'on' | 'off' } }
	message: { options: { text: string } }
	quality: { options: { q: '480p' | '720p' | '1080p' } }
	portrait: { options: { mode: 'landscape' | 'portrait' } }
	failover: { options: { mode: OnOff } }
	failover_target: { options: { layout: string } }
	monitor_mute: { options: { mode: OnOff } }
	raw_command: { options: { json: string } }
}

const ONOFF: DropdownChoice[] = [
	{ id: 'toggle', label: 'Toggle' },
	{ id: 'on', label: 'On' },
	{ id: 'off', label: 'Off' },
]

export function UpdateActions(self: LiveDeckInstance): void {
	const s = () => self.state
	const layouts: DropdownChoice[] = (self.state.layouts ?? []).map((l) => ({ id: l.id, label: l.name }))
	const layoutOrPrev: DropdownChoice[] = [{ id: '', label: 'Previous layout' }, ...layouts]
	const styles: DropdownChoice[] = [
		{ id: '', label: 'Studio default' },
		...self.takeStyles.map((t) => ({ id: t.id, label: t.name })),
	]
	const channels: DropdownChoice[] = (self.state.audio ?? []).map((a) => ({ id: a.id, label: a.name }))
	const firstLayout = String(layouts[0]?.id ?? '')
	const firstChannel = String(channels[0]?.id ?? '')
	const want = (mode: OnOff, current: boolean | undefined): boolean => (mode === 'toggle' ? !current : mode === 'on')
	const modeOpt = { type: 'dropdown' as const, id: 'mode' as const, label: 'Mode', choices: ONOFF, default: 'toggle' }

	self.setActionDefinitions({
		layout_cue: {
			name: 'Cue layout',
			description: 'Cue a layout to preview (green ring). Program is unchanged.',
			options: [{ type: 'dropdown', id: 'layout', label: 'Layout', choices: layouts, default: firstLayout }],
			callback: async (a) => { await self.api.command({ action: 'cue', id: a.options.layout }) },
		},
		layout_take: {
			name: 'Take layout to Program',
			description: 'Cue and take a layout with its own transition, or the one chosen here.',
			options: [
				{ type: 'dropdown', id: 'layout', label: 'Layout', choices: layouts, default: firstLayout },
				{ type: 'dropdown', id: 'style', label: 'Transition', choices: styles, default: '' },
			],
			callback: async (a) => {
				const { layout: id, style } = a.options
				await self.api.command(style ? { action: 'sendLayoutStyle', id, style } : { action: 'sendLayout', id })
			},
		},
		take: {
			name: 'Take (cued → Program)',
			options: [{ type: 'dropdown', id: 'style', label: 'Transition', choices: styles, default: '' }],
			callback: async (a) => { await self.api.command(a.options.style ? { action: 'take', style: a.options.style } : { action: 'take' }) },
		},
		cut: {
			name: 'Cut (cued → Program)',
			options: [],
			callback: async () => { await self.api.command({ action: 'take', style: 'cut' }) },
		},
		transition_default: {
			name: 'Set default transition',
			options: [{ type: 'dropdown', id: 'style', label: 'Transition', choices: styles.slice(1), default: 'dissolve' }],
			callback: async (a) => { await self.api.command({ action: 'takeStyle', value: a.options.style }) },
		},
		record: {
			name: 'Record',
			options: [modeOpt],
			callback: async (a) => { await self.api.command({ action: 'record', value: want(a.options.mode, s().out?.rec) }) },
		},
		stream: {
			name: 'Stream (RTMP push)',
			options: [modeOpt],
			callback: async (a) => { await self.api.command({ action: 'rtmp', value: want(a.options.mode, s().out?.rtmp) }) },
		},
		ndi_out: {
			name: 'NDI output',
			options: [modeOpt],
			callback: async (a) => { await self.api.command({ action: 'ndiOut', value: want(a.options.mode, s().out?.ndi) }) },
		},
		hls: {
			name: 'HLS pull server',
			options: [modeOpt],
			callback: async (a) => { await self.api.command({ action: 'hls', value: want(a.options.mode, s().out?.hls) }) },
		},
		audio_mute: {
			name: 'Mute channel',
			options: [{ type: 'dropdown', id: 'channel', label: 'Channel', choices: channels, default: firstChannel }, modeOpt],
			callback: async (a) => {
				const cur = (s().audio ?? []).find((c) => c.id === a.options.channel)?.muted
				if (a.options.mode === 'toggle' || want(a.options.mode, cur) !== !!cur) await self.api.command({ action: 'mute', id: a.options.channel })
			},
		},
		audio_solo: {
			name: 'Solo channel',
			options: [{ type: 'dropdown', id: 'channel', label: 'Channel', choices: channels, default: firstChannel }, modeOpt],
			callback: async (a) => {
				const cur = (s().audio ?? []).find((c) => c.id === a.options.channel)?.solo
				if (a.options.mode === 'toggle' || want(a.options.mode, cur) !== !!cur) await self.api.command({ action: 'solo', id: a.options.channel })
			},
		},
		audio_gain: {
			name: 'Channel fader',
			options: [
				{ type: 'dropdown', id: 'channel', label: 'Channel', choices: channels, default: firstChannel },
				{ type: 'number', id: 'gain', label: 'Gain (0 = silent, 1 = unity, 1.5 = max)', default: 1, min: 0, max: 1.5, step: 0.05 },
			],
			callback: async (a) => { await self.api.command({ action: 'gain', id: a.options.channel, value: Number(a.options.gain) }) },
		},
		master_gain: {
			name: 'Master fader',
			options: [{ type: 'number', id: 'gain', label: 'Gain (0…1.5)', default: 1, min: 0, max: 1.5, step: 0.05 }],
			callback: async (a) => { await self.api.command({ action: 'master', value: Number(a.options.gain) }) },
		},
		audio_follow: {
			name: 'Audio follows Program / manual',
			options: [{ type: 'dropdown', id: 'mode', label: 'Mode', choices: [{ id: 'follow', label: 'Follow Program' }, { id: 'manual', label: 'Manual' }], default: 'follow' }],
			callback: async (a) => { await self.api.command({ action: 'audioMode', value: a.options.mode }) },
		},
		show_start: {
			name: 'Run a Show: start',
			options: [
				{ type: 'checkbox', id: 'record', label: 'Record', default: true },
				{ type: 'checkbox', id: 'stream', label: 'Stream', default: true },
			],
			callback: async (a) => { await self.api.command({ action: 'startShow', record: !!a.options.record, stream: !!a.options.stream }) },
		},
		show_next: { name: 'Run a Show: next step', options: [], callback: async () => { await self.api.command({ action: 'showNext' }) } },
		show_step: {
			name: 'Run a Show: go to step',
			options: [{ type: 'number', id: 'index', label: 'Step (0 = first)', default: 0, min: 0, max: 200 }],
			callback: async (a) => { await self.api.command({ action: 'showStep', index: Number(a.options.index) }) },
		},
		show_end: { name: 'Run a Show: end', options: [], callback: async () => { await self.api.command({ action: 'endShow' }) } },
		talk: {
			name: 'Talkback (Down = on, Up = off for hold-to-talk)',
			options: [{ type: 'dropdown', id: 'mode', label: 'Mode', choices: [{ id: 'on', label: 'On' }, { id: 'off', label: 'Off' }], default: 'on' }],
			callback: async (a) => { await self.api.command({ action: 'talkback', value: a.options.mode === 'on' }) },
		},
		message: {
			name: 'Message the satellites',
			options: [{ type: 'textinput', id: 'text', label: 'Text', default: 'Stand by', useVariables: true }],
			callback: async (a) => { await self.api.command({ action: 'message', text: String(a.options.text ?? ''), to: 'all' }) },
		},
		quality: {
			name: 'Program resolution',
			options: [{ type: 'dropdown', id: 'q', label: 'Resolution', choices: [{ id: '480p', label: '480p' }, { id: '720p', label: '720p' }, { id: '1080p', label: '1080p' }], default: '1080p' }],
			callback: async (a) => { await self.api.command({ action: 'quality', value: a.options.q }) },
		},
		portrait: {
			name: 'Program orientation',
			options: [{ type: 'dropdown', id: 'mode', label: 'Orientation', choices: [{ id: 'landscape', label: 'Landscape 16:9' }, { id: 'portrait', label: 'Portrait 9:16' }], default: 'landscape' }],
			callback: async (a) => { await self.api.command({ action: 'portrait', value: a.options.mode === 'portrait' }) },
		},
		failover: {
			name: 'Auto switch-away when the on-air source drops',
			options: [modeOpt],
			callback: async (a) => { await self.api.command({ action: 'failover', on: want(a.options.mode, s().failoverOn) }) },
		},
		failover_target: {
			name: 'Auto switch-away: fallback layout',
			options: [{ type: 'dropdown', id: 'layout', label: 'Switch to', choices: layoutOrPrev, default: '' }],
			callback: async (a) => { await self.api.command({ action: 'failover', target: a.options.layout ?? '' }) },
		},
		monitor_mute: {
			name: 'Monitor audio (the device speaker)',
			options: [modeOpt],
			callback: async (a) => { await self.api.command({ action: 'monitorMute', value: want(a.options.mode, s().monMuted) }) },
		},
		raw_command: {
			name: 'Raw command (advanced)',
			description: 'Any command from the Studio\'s /api docs page, as JSON, e.g. {"action":"cue","id":"…"}',
			options: [{ type: 'textinput', id: 'json', label: 'JSON', default: '{"action":"take"}', useVariables: true }],
			callback: async (a) => { await self.api.command(JSON.parse(String(a.options.json ?? '{}'))) },
		},
	})
}
