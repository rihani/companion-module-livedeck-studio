import { combineRgb, type DropdownChoice } from '@companion-module/base'
import { GO_LIVE_OUTPUTS, type GoLiveOutput } from './actions.js'
import { liveNow } from './api.js'
import type LiveDeckInstance from './main.js'

export const RED = combineRgb(216, 44, 44)
export const GREEN = combineRgb(46, 204, 113)
export const AMBER = combineRgb(230, 162, 60)
export const BLUE = combineRgb(43, 107, 255)
export const WHITE = combineRgb(255, 255, 255)
export const BLACK = combineRgb(0, 0, 0)

export type FeedbacksSchema = {
	layout_live: { type: 'boolean'; options: { layout: string } }
	layout_cued: { type: 'boolean'; options: { layout: string } }
	layout_offline: { type: 'boolean'; options: { layout: string } }
	recording: { type: 'boolean'; options: Record<string, never> }
	streaming: { type: 'boolean'; options: Record<string, never> }
	stream_connecting: { type: 'boolean'; options: Record<string, never> }
	ndi_out: { type: 'boolean'; options: Record<string, never> }
	hls: { type: 'boolean'; options: Record<string, never> }
	audio_muted: { type: 'boolean'; options: { channel: string } }
	audio_solo: { type: 'boolean'; options: { channel: string } }
	audio_follow: { type: 'boolean'; options: Record<string, never> }
	health_warn: { type: 'boolean'; options: Record<string, never> }
	health_bad: { type: 'boolean'; options: Record<string, never> }
	failover_on: { type: 'boolean'; options: Record<string, never> }
	rec_silent: { type: 'boolean'; options: Record<string, never> }
	live: { type: 'boolean'; options: Record<string, never> }
	go_live_selected: { type: 'boolean'; options: { output: GoLiveOutput } }
}

export function UpdateFeedbacks(self: LiveDeckInstance): void {
	const s = () => self.state
	const layouts: DropdownChoice[] = (self.state.layouts ?? []).map((l) => ({ id: l.id, label: l.name }))
	const channels: DropdownChoice[] = (self.state.audio ?? []).map((a) => ({ id: a.id, label: a.name }))
	const layoutOpt = {
		type: 'dropdown' as const,
		id: 'layout' as const,
		label: 'Layout',
		choices: layouts,
		default: String(layouts[0]?.id ?? ''),
	}
	const channelOpt = {
		type: 'dropdown' as const,
		id: 'channel' as const,
		label: 'Channel',
		choices: channels,
		default: String(channels[0]?.id ?? ''),
	}

	self.setFeedbackDefinitions({
		layout_live: {
			type: 'boolean',
			name: 'Layout is on air',
			options: [layoutOpt],
			defaultStyle: { bgcolor: RED, color: WHITE },
			callback: (f) => s().liveLayout === f.options.layout,
		},
		layout_cued: {
			type: 'boolean',
			name: 'Layout is cued',
			options: [layoutOpt],
			defaultStyle: { bgcolor: GREEN, color: BLACK },
			callback: (f) => s().cuedLayout === f.options.layout,
		},
		layout_offline: {
			type: 'boolean',
			name: 'Layout has a source that stopped sending',
			options: [layoutOpt],
			defaultStyle: { bgcolor: AMBER, color: BLACK },
			callback: (f) => (s().offlineLayouts ?? []).includes(f.options.layout),
		},
		recording: {
			type: 'boolean',
			name: 'Recording',
			options: [],
			defaultStyle: { bgcolor: RED, color: WHITE },
			callback: () => !!s().out?.rec,
		},
		streaming: {
			type: 'boolean',
			name: 'Streaming (RTMP push live)',
			options: [],
			defaultStyle: { bgcolor: GREEN, color: BLACK },
			callback: () => !!s().out?.rtmp,
		},
		stream_connecting: {
			type: 'boolean',
			name: 'Stream connecting',
			options: [],
			defaultStyle: { bgcolor: AMBER, color: BLACK },
			callback: () => !!s().out?.rtmpConnecting,
		},
		ndi_out: {
			type: 'boolean',
			name: 'NDI output on',
			options: [],
			defaultStyle: { bgcolor: GREEN, color: BLACK },
			callback: () => !!s().out?.ndi,
		},
		hls: {
			type: 'boolean',
			name: 'HLS pull server on',
			options: [],
			defaultStyle: { bgcolor: GREEN, color: BLACK },
			callback: () => !!s().out?.hls,
		},
		audio_muted: {
			type: 'boolean',
			name: 'Channel muted',
			options: [channelOpt],
			defaultStyle: { bgcolor: RED, color: WHITE },
			callback: (f) => !!(s().audio ?? []).find((c) => c.id === f.options.channel)?.muted,
		},
		audio_solo: {
			type: 'boolean',
			name: 'Channel soloed',
			options: [channelOpt],
			defaultStyle: { bgcolor: AMBER, color: BLACK },
			callback: (f) => !!(s().audio ?? []).find((c) => c.id === f.options.channel)?.solo,
		},
		audio_follow: {
			type: 'boolean',
			name: 'Audio follows Program',
			options: [],
			defaultStyle: { bgcolor: BLUE, color: WHITE },
			callback: () => !!s().audioFollow,
		},
		health_warn: {
			type: 'boolean',
			name: 'Program health: warning or worse',
			options: [],
			defaultStyle: { bgcolor: AMBER, color: BLACK },
			callback: () => (s().health ?? []).some((h) => h.level === 'warn' || h.level === 'bad'),
		},
		health_bad: {
			type: 'boolean',
			name: 'Program health: bad',
			options: [],
			defaultStyle: { bgcolor: RED, color: WHITE },
			callback: () => (s().health ?? []).some((h) => h.level === 'bad'),
		},
		failover_on: {
			type: 'boolean',
			name: 'Auto switch-away is on',
			options: [],
			defaultStyle: { bgcolor: BLUE, color: WHITE },
			callback: () => !!s().failoverOn,
		},
		live: {
			type: 'boolean',
			name: 'GO LIVE: on air',
			description:
				'The Studio is live (GO LIVE pressed). On Studios that do not report GO LIVE yet: any output running.',
			options: [],
			defaultStyle: { bgcolor: RED, color: WHITE },
			callback: () => liveNow(s()),
		},
		go_live_selected: {
			type: 'boolean',
			name: 'GO LIVE: output is ticked',
			options: [{ type: 'dropdown', id: 'output', label: 'Output', choices: GO_LIVE_OUTPUTS, default: 'ndi' }],
			defaultStyle: { bgcolor: BLUE, color: WHITE },
			callback: (f) => !!s().liveSelection?.[f.options.output],
		},
		rec_silent: {
			type: 'boolean',
			name: 'Recording with no audio',
			options: [],
			defaultStyle: { bgcolor: AMBER, color: BLACK },
			callback: () => !!s().out?.rec && (s().recAudioState === 'silent' || s().recAudioState === 'none'),
		},
	})
}
