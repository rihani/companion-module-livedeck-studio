import { combineRgb, type DropdownChoice } from '@companion-module/base'
import { GO_LIVE_OUTPUTS, type GoLiveOutput } from './actions.js'
import { liveNow } from './api.js'
import { fundSkinOnAir, milestoneHit } from './fund.js'
import { skinOnAir } from './score.js'
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
	score_clock_running: { type: 'boolean'; options: Record<string, never> }
	score_bug_on: { type: 'boolean'; options: { skin: string } }
	score_board_on: { type: 'boolean'; options: Record<string, never> }
	score_final: { type: 'boolean'; options: Record<string, never> }
	score_in_break: { type: 'boolean'; options: Record<string, never> }
	score_period_is: { type: 'boolean'; options: { n: number } }
	score_leading: { type: 'boolean'; options: { team: 'home' | 'away' } }
	fund_on_air: { type: 'boolean'; options: Record<string, never> }
	fund_full_on_air: { type: 'boolean'; options: Record<string, never> }
	fund_min_reached: { type: 'boolean'; options: Record<string, never> }
	fund_goal_reached: { type: 'boolean'; options: Record<string, never> }
	fund_stretch_reached: { type: 'boolean'; options: Record<string, never> }
}

export function UpdateFeedbacks(self: LiveDeckInstance): void {
	const s = () => self.state
	const layouts: DropdownChoice[] = (self.state.layouts ?? []).map((l) => ({ id: l.id, label: l.name }))
	const channels: DropdownChoice[] = (self.state.audio ?? []).map((a) => ({ id: a.id, label: a.name }))
	const skinChoices: DropdownChoice[] = self.scoreSkins.map((k) => ({ id: k.id, label: k.name || k.style || k.id }))
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
		score_clock_running: {
			type: 'boolean',
			name: 'Score: game clock is running',
			options: [],
			defaultStyle: { bgcolor: GREEN, color: BLACK },
			callback: () => !!self.score.game?.clock?.run && self.score.game.clock.dir !== 'none',
		},
		score_bug_on: {
			type: 'boolean',
			name: 'Score: bug is on air',
			options: [
				{
					type: 'dropdown',
					id: 'skin',
					label: 'Bug',
					choices: [{ id: '', label: 'Any score bug' }, ...skinChoices],
					default: '',
				},
			],
			defaultStyle: { bgcolor: RED, color: WHITE },
			callback: (f) =>
				f.options.skin
					? skinOnAir(self.scoreSkins.find((k) => k.id === f.options.skin))
					: !!self.score.bugOn || self.scoreSkins.some(skinOnAir),
		},
		score_board_on: {
			type: 'boolean',
			name: 'Score: scoreboard is on air',
			options: [],
			defaultStyle: { bgcolor: RED, color: WHITE },
			callback: () => !!self.score.boardOn,
		},
		score_final: {
			type: 'boolean',
			name: 'Score: game is final',
			options: [],
			defaultStyle: { bgcolor: AMBER, color: BLACK },
			callback: () => !!self.score.game?.final,
		},
		score_in_break: {
			type: 'boolean',
			name: 'Score: between periods',
			options: [],
			defaultStyle: { bgcolor: AMBER, color: BLACK },
			callback: () => !!self.score.game?.brk && !self.score.game.final,
		},
		score_period_is: {
			type: 'boolean',
			name: 'Score: period is N',
			options: [{ type: 'number', id: 'n', label: 'Period', default: 1, min: 1, max: 20 }],
			defaultStyle: { bgcolor: BLUE, color: WHITE },
			callback: (f) => (self.score.game?.period ?? 0) === Number(f.options.n),
		},
		score_leading: {
			type: 'boolean',
			name: 'Score: team is leading',
			options: [
				{
					type: 'dropdown',
					id: 'team',
					label: 'Team',
					choices: [
						{ id: 'home', label: 'Home' },
						{ id: 'away', label: 'Away' },
					],
					default: 'home',
				},
			],
			defaultStyle: { bgcolor: GREEN, color: BLACK },
			callback: (f) => {
				const g = self.score.game
				const h = g?.home?.score ?? 0
				const a = g?.away?.score ?? 0
				return f.options.team === 'home' ? h > a : a > h
			},
		},
		fund_on_air: {
			type: 'boolean',
			name: 'Fundraiser: bug is on air',
			options: [],
			defaultStyle: { bgcolor: RED, color: WHITE },
			callback: () => !!self.fund.bugOn || !!self.fund.fund?.show?.on || self.fundSkins.some(fundSkinOnAir),
		},
		fund_full_on_air: {
			type: 'boolean',
			name: 'Fundraiser: full-screen appeal is on Program',
			options: [],
			defaultStyle: { bgcolor: RED, color: WHITE },
			callback: () => !!self.fund.layoutOn,
		},
		fund_min_reached: {
			type: 'boolean',
			name: 'Fundraiser: minimum reached',
			options: [],
			defaultStyle: { bgcolor: AMBER, color: BLACK },
			callback: () => milestoneHit(self.fund.fund, 'min'),
		},
		fund_goal_reached: {
			type: 'boolean',
			name: 'Fundraiser: goal reached',
			options: [],
			defaultStyle: { bgcolor: GREEN, color: BLACK },
			callback: () => milestoneHit(self.fund.fund, 'target'),
		},
		fund_stretch_reached: {
			type: 'boolean',
			name: 'Fundraiser: stretch goal reached',
			options: [],
			defaultStyle: { bgcolor: BLUE, color: WHITE },
			callback: () => milestoneHit(self.fund.fund, 'stretch'),
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
