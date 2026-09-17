import { combineRgb, type DropdownChoice } from '@companion-module/base'
import type LiveDeckInstance from './main.js'

export const RED = combineRgb(216, 44, 44)
export const GREEN = combineRgb(46, 204, 113)
export const AMBER = combineRgb(230, 162, 60)
export const BLUE = combineRgb(43, 107, 255)
export const WHITE = combineRgb(255, 255, 255)
export const BLACK = combineRgb(0, 0, 0)

export function UpdateFeedbacks(self: LiveDeckInstance): void {
	const s = () => self.state
	const layouts: DropdownChoice[] = (self.state.layouts ?? []).map((l) => ({ id: l.id, label: l.name }))
	const channels: DropdownChoice[] = (self.state.audio ?? []).map((a) => ({ id: a.id, label: a.name }))
	const layoutOpt = { type: 'dropdown' as const, id: 'layout', label: 'Layout', choices: layouts, default: String(layouts[0]?.id ?? '') }
	const channelOpt = { type: 'dropdown' as const, id: 'channel', label: 'Channel', choices: channels, default: String(channels[0]?.id ?? '') }

	self.setFeedbackDefinitions({
		layout_live: {
			type: 'boolean', name: 'Layout is on air', options: [layoutOpt],
			defaultStyle: { bgcolor: RED, color: WHITE },
			callback: (f) => s().liveLayout === String(f.options.layout ?? ''),
		},
		layout_cued: {
			type: 'boolean', name: 'Layout is cued', options: [layoutOpt],
			defaultStyle: { bgcolor: GREEN, color: BLACK },
			callback: (f) => s().cuedLayout === String(f.options.layout ?? ''),
		},
		layout_offline: {
			type: 'boolean', name: 'Layout has a source that stopped sending', options: [layoutOpt],
			defaultStyle: { bgcolor: AMBER, color: BLACK },
			callback: (f) => (s().offlineLayouts ?? []).includes(String(f.options.layout ?? '')),
		},
		recording: { type: 'boolean', name: 'Recording', options: [], defaultStyle: { bgcolor: RED, color: WHITE }, callback: () => !!s().out?.rec },
		streaming: { type: 'boolean', name: 'Streaming (RTMP push live)', options: [], defaultStyle: { bgcolor: GREEN, color: BLACK }, callback: () => !!s().out?.rtmp },
		stream_connecting: { type: 'boolean', name: 'Stream connecting', options: [], defaultStyle: { bgcolor: AMBER, color: BLACK }, callback: () => !!s().out?.rtmpConnecting },
		ndi_out: { type: 'boolean', name: 'NDI output on', options: [], defaultStyle: { bgcolor: GREEN, color: BLACK }, callback: () => !!s().out?.ndi },
		hls: { type: 'boolean', name: 'HLS pull server on', options: [], defaultStyle: { bgcolor: GREEN, color: BLACK }, callback: () => !!s().out?.hls },
		audio_muted: {
			type: 'boolean', name: 'Channel muted', options: [channelOpt],
			defaultStyle: { bgcolor: RED, color: WHITE },
			callback: (f) => !!(s().audio ?? []).find((c) => c.id === String(f.options.channel ?? ''))?.muted,
		},
		audio_solo: {
			type: 'boolean', name: 'Channel soloed', options: [channelOpt],
			defaultStyle: { bgcolor: AMBER, color: BLACK },
			callback: (f) => !!(s().audio ?? []).find((c) => c.id === String(f.options.channel ?? ''))?.solo,
		},
		audio_follow: { type: 'boolean', name: 'Audio follows Program', options: [], defaultStyle: { bgcolor: BLUE, color: WHITE }, callback: () => !!s().audioFollow },
		health_warn: {
			type: 'boolean', name: 'Program health: warning or worse', options: [],
			defaultStyle: { bgcolor: AMBER, color: BLACK },
			callback: () => (s().health ?? []).some((h) => h.level === 'warn' || h.level === 'bad'),
		},
		health_bad: {
			type: 'boolean', name: 'Program health: bad', options: [],
			defaultStyle: { bgcolor: RED, color: WHITE },
			callback: () => (s().health ?? []).some((h) => h.level === 'bad'),
		},
		failover_on: { type: 'boolean', name: 'Auto switch-away is on', options: [], defaultStyle: { bgcolor: BLUE, color: WHITE }, callback: () => !!s().failoverOn },
		rec_silent: {
			type: 'boolean', name: 'Recording with no audio', options: [],
			defaultStyle: { bgcolor: AMBER, color: BLACK },
			callback: () => !!s().out?.rec && (s().recAudioState === 'silent' || s().recAudioState === 'none'),
		},
	})
}
