import type { DropdownChoice } from '@companion-module/base'
import { liveNow } from './api.js'
import { FUND_STYLES, fundStyleId, fundThemeFor, parseMajor } from './fund.js'
import type LiveDeckInstance from './main.js'

type OnOff = 'toggle' | 'on' | 'off'
export type GoLiveOutput = 'ndi' | 'rtmp' | 'facebook' | 'youtube' | 'record' | 'hls' | 'rtmpServer'
export type PtzDirection = 'up' | 'down' | 'left' | 'right' | 'upleft' | 'upright' | 'downleft' | 'downright' | 'stop'
export type ZoomDirection = 'in' | 'out' | 'stop'

export type ActionsSchema = {
	layout_cue: { options: { layout: string } }
	layout_take: { options: { layout: string; style: string } }
	take: { options: { style: string } }
	cut: { options: Record<string, never> }
	transition_default: { options: { style: string } }
	go_live: { options: { mode: OnOff } }
	go_live_select: { options: { output: GoLiveOutput; mode: OnOff } }
	record: { options: { mode: OnOff } }
	stream: { options: { mode: OnOff } }
	ndi_out: { options: { mode: OnOff } }
	hls: { options: { mode: OnOff } }
	audio_mute: { options: { channel: string; mode: OnOff } }
	audio_solo: { options: { channel: string; mode: OnOff } }
	audio_gain: { options: { channel: string; gain: number } }
	master_gain: { options: { gain: number } }
	audio_follow: { options: { mode: 'follow' | 'manual' } }
	ptz_recall: { options: { target: string; preset: number } }
	ptz_store: { options: { target: string; preset: number } }
	ptz_move: { options: { target: string; direction: PtzDirection; speed: number } }
	ptz_zoom: { options: { target: string; direction: ZoomDirection; speed: number } }
	show_start: { options: { record: boolean; stream: boolean } }
	show_next: { options: Record<string, never> }
	show_step: { options: { index: number } }
	show_end: { options: Record<string, never> }
	talk: { options: { mode: 'on' | 'off' } }
	talk_target: { options: { target: string } }
	message: { options: { text: string } }
	quality: { options: { q: '480p' | '720p' | '1080p' } }
	portrait: { options: { mode: 'landscape' | 'portrait' } }
	failover: { options: { mode: OnOff } }
	failover_target: { options: { layout: string } }
	monitor_mute: { options: { mode: OnOff } }
	raw_command: { options: { json: string } }
	fb_login: { options: { force: boolean } }
	fb_login_cancel: { options: Record<string, never> }
	fb_target: { options: { target: string } }
	fb_privacy: { options: { value: 'public' | 'friends' | 'only_me' } }
	fb_details: { options: { title: string; description: string } }
	fb_signout: { options: Record<string, never> }
	fb_remember: { options: { mode: OnOff } }
	schedule_cancel_today: { options: Record<string, never> }
	schedule_enable: { options: { schedule: string; mode: OnOff } }
	schedule_skip: { options: { schedule: string } }
	show_load: { options: { show: string } }
	golive_retry: { options: Record<string, never> }
	crew_standby: { options: { person: string } }
	guest_kick: { options: { guest: string } }
	fund_add: { options: { amount: number; name: string } }
	fund_remove: { options: { amount: number; name: string } }
	fund_quick: { options: { preset: string } }
	fund_undo: { options: Record<string, never> }
	fund_set: { options: { raised: string; donors: string } }
	fund_show: { options: Record<string, never> }
	fund_hide: { options: Record<string, never> }
	fund_toggle: { options: Record<string, never> }
	fund_mode: { options: { mode: 'gauge' | 'numbers' | 'both' } }
	fund_style: { options: { target: FundTarget; style: string; theme: string; pos: string } }
	fund_celebrate: { options: Record<string, never> }
	score_add: { options: { team: ScoreTeamId; value: number } }
	score_set: { options: { team: ScoreTeamId; value: number } }
	score_clock: { options: { mode: 'toggle' | 'start' | 'stop' | 'reset' } }
	score_clock_set: { options: { time: string } }
	score_period: { options: { dir: 'next' | 'prev' } }
	score_bug: { options: { mode: OnOff; skin: string } }
	score_board: { options: { mode: 'cue' | 'take' } }
	score_undo: { options: Record<string, never> }
	score_swap: { options: Record<string, never> }
	score_final: { options: Record<string, never> }
	score_shot: { options: { mode: 'reset' | 'start' | 'stop' } }
	score_view: { options: { mode: 'bug' | 'board' | 'off' } }
	score_scorer: { options: { team: 'home' | 'away'; n: string } }
	score_player_add: { options: { team: 'home' | 'away'; n: string; name: string } }
	score_player_remove: { options: { team: 'home' | 'away'; n: string } }
	score_roster_set: { options: { team: 'home' | 'away'; list: string } }
	score_setup: {
		options: {
			sport: string
			title: string
			home: string
			homeShort: string
			homeColor: string
			away: string
			awayShort: string
			awayColor: string
			periods: number
			minutes: number
		}
	}
	fund_view: { options: { mode: 'bar' | 'full' | 'off' } }
	fund_setup: { options: { title: string; desc: string; cur: string; target: string; min: string; stretch: string } }
	wb_add: { options: { kind: 'white' | 'grid' | 'chalk' | 'drawing' } }
	wb_do: { options: { board: string; op: 'clear' | 'undo' | 'redo' | 'show' | 'hide' } }
	wb_stroke: { options: { board: string; points: string; tool: string; color: string; size: 'S' | 'M' | 'L' } }
	wb_page: { options: { board: string; page: string } }
}
export type FundTarget = 'bug' | 'layout' | 'both'
export type ScoreTeamId = 'home' | 'away'

const ONOFF: DropdownChoice[] = [
	{ id: 'toggle', label: 'Toggle' },
	{ id: 'on', label: 'On' },
	{ id: 'off', label: 'Off' },
]

export const GO_LIVE_OUTPUTS: DropdownChoice[] = [
	{ id: 'ndi', label: 'NDI output' },
	{ id: 'rtmp', label: 'Stream (RTMP)' },
	{ id: 'facebook', label: 'Facebook Live (one-tap; phone: login on the device, Apple TV: code on the TV)' },
	{ id: 'youtube', label: 'YouTube Live (one-tap; the Google sign-in happens on the device)' },
	{ id: 'record', label: 'Record' },
	{ id: 'hls', label: 'HLS pull server' },
	{ id: 'rtmpServer', label: 'RTMP server' },
]

const PTZ_DIRECTIONS: DropdownChoice[] = [
	{ id: 'up', label: 'Up' },
	{ id: 'down', label: 'Down' },
	{ id: 'left', label: 'Left' },
	{ id: 'right', label: 'Right' },
	{ id: 'upleft', label: 'Up + left' },
	{ id: 'upright', label: 'Up + right' },
	{ id: 'downleft', label: 'Down + left' },
	{ id: 'downright', label: 'Down + right' },
	{ id: 'stop', label: 'Stop' },
]

/** Pan / tilt unit vectors in NDI PTZ terms (pan +1 = left, tilt +1 = up), as the web remote sends them. */
const PTZ_VECTORS: Record<PtzDirection, [number, number]> = {
	up: [0, 1],
	down: [0, -1],
	left: [1, 0],
	right: [-1, 0],
	upleft: [1, 1],
	upright: [-1, 1],
	downleft: [1, -1],
	downright: [-1, -1],
	stop: [0, 0],
}

/**
 * PTZ camera choices: the on-air camera, then every layout holding a PTZ camera (and each slot
 * when the full state lists them). Custom values such as "program:1" or "<layoutId>:2" are allowed.
 */
export function ptzTargets(self: LiveDeckInstance): DropdownChoice[] {
	const out: DropdownChoice[] = [{ id: 'program', label: 'On-air camera (Program)' }]
	for (const c of self.ptzProgramCams) out.push({ id: c.target, label: `Program · ${c.name}` })
	for (const l of self.state.layouts ?? []) {
		if (!l.ptz) continue
		out.push({ id: l.id, label: `${l.name} (first PTZ camera)` })
		for (const c of self.ptzLayoutCams.get(l.id) ?? []) out.push({ id: c.target, label: `${l.name} · ${c.name}` })
	}
	return out
}

export function UpdateActions(self: LiveDeckInstance): void {
	const s = () => self.state
	const send = async (cmd: Record<string, unknown>): Promise<void> => self.send(cmd)
	const layouts: DropdownChoice[] = (self.state.layouts ?? []).map((l) => ({ id: l.id, label: l.name }))
	const layoutOrPrev: DropdownChoice[] = [{ id: '', label: 'Previous layout' }, ...layouts]
	const styles: DropdownChoice[] = [
		{ id: '', label: 'Studio default' },
		...self.takeStyles.map((t) => ({ id: t.id, label: t.name })),
	]
	const channels: DropdownChoice[] = (self.state.audio ?? []).map((a) => ({ id: a.id, label: a.name }))
	const firstLayout = String(layouts[0]?.id ?? '')
	const firstChannel = String(channels[0]?.id ?? '')
	const fundCall = async (op: string, params?: Record<string, unknown>): Promise<void> => self.fundCall(op, params)
	const scoreCall = async (path: string): Promise<void> => self.scoreCall(path)
	const skinChoices: DropdownChoice[] = self.scoreSkins.map((k) => ({ id: k.id, label: k.name || k.style || k.id }))
	const boardOpt = {
		type: 'textinput' as const,
		id: 'board' as const,
		label: 'Board id (blank = the first whiteboard or drawing)',
		default: '',
		useVariables: true,
	}
	/** The board to act on: the id typed, else the first one the Studio lists (GET /api/whiteboard). */
	const boardId = async (typed: string): Promise<string | undefined> => {
		if (typed.trim()) return typed.trim()
		const r = await self.apiCall('GET', '/api/whiteboard')
		const boards = (r?.boards ?? []) as { id: string }[]
		if (!boards.length) self.log('warn', 'No whiteboard yet: add one first (Whiteboard: add a board)')
		return boards[0]?.id
	}
	const teamOpt = {
		type: 'dropdown' as const,
		id: 'team' as const,
		label: 'Team',
		choices: [
			{ id: 'home', label: 'Home' },
			{ id: 'away', label: 'Away' },
		],
		default: 'home',
	}
	const want = (mode: OnOff, current: boolean | undefined): boolean => (mode === 'toggle' ? !current : mode === 'on')
	const modeOpt = { type: 'dropdown' as const, id: 'mode' as const, label: 'Mode', choices: ONOFF, default: 'toggle' }
	const targetOpt = {
		type: 'dropdown' as const,
		id: 'target' as const,
		label: 'Camera',
		choices: ptzTargets(self),
		default: 'program',
		allowCustom: true,
		tooltip: '"program", a layout id, or "<layoutId>:<slot>" / "program:<slot>" for one camera of a split layout',
	}
	const presetOpt = {
		type: 'number' as const,
		id: 'preset' as const,
		label: 'Preset number',
		default: 1,
		min: 0,
		max: 255,
	}
	const speedOpt = {
		type: 'number' as const,
		id: 'speed' as const,
		label: 'Speed (0.05 – 1)',
		default: 0.6,
		min: 0.05,
		max: 1,
		step: 0.05,
	}

	self.setActionDefinitions({
		layout_cue: {
			name: 'Cue layout',
			description: 'Cue a layout to preview (green ring). Program is unchanged.',
			options: [{ type: 'dropdown', id: 'layout', label: 'Layout', choices: layouts, default: firstLayout }],
			callback: async (a) => send({ action: 'cue', id: a.options.layout }),
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
				await send(style ? { action: 'sendLayoutStyle', id, style } : { action: 'sendLayout', id })
			},
		},
		take: {
			name: 'Take (cued → Program)',
			options: [{ type: 'dropdown', id: 'style', label: 'Transition', choices: styles, default: '' }],
			callback: async (a) => send(a.options.style ? { action: 'take', style: a.options.style } : { action: 'take' }),
		},
		cut: {
			name: 'Cut (cued → Program)',
			options: [],
			callback: async () => send({ action: 'take', style: 'cut' }),
		},
		transition_default: {
			name: 'Set default transition',
			options: [{ type: 'dropdown', id: 'style', label: 'Transition', choices: styles.slice(1), default: 'dissolve' }],
			callback: async (a) => send({ action: 'takeStyle', value: a.options.style }),
		},
		go_live: {
			name: 'GO LIVE / stop',
			description:
				'Starts (or stops) every output ticked for GO LIVE in the Studio, together — the same as the GO LIVE button in the app.',
			options: [modeOpt],
			callback: async (a) => send({ action: want(a.options.mode, liveNow(s())) ? 'goLive' : 'stopLive' }),
		},
		go_live_select: {
			name: 'GO LIVE: choose what it starts',
			description: 'Ticks or unticks an output for GO LIVE. Starts or stops nothing by itself.',
			options: [{ type: 'dropdown', id: 'output', label: 'Output', choices: GO_LIVE_OUTPUTS, default: 'ndi' }, modeOpt],
			callback: async (a) =>
				send({
					action: 'liveSelectionSet',
					field: a.options.output,
					value: want(a.options.mode, s().liveSelection?.[a.options.output]),
				}),
		},
		record: {
			name: 'Record',
			options: [modeOpt],
			callback: async (a) => send({ action: 'record', value: want(a.options.mode, s().out?.rec) }),
		},
		stream: {
			name: 'Stream (RTMP push)',
			options: [modeOpt],
			callback: async (a) => send({ action: 'rtmp', value: want(a.options.mode, s().out?.rtmp) }),
		},
		ndi_out: {
			name: 'NDI output',
			options: [modeOpt],
			callback: async (a) => send({ action: 'ndiOut', value: want(a.options.mode, s().out?.ndi) }),
		},
		hls: {
			name: 'HLS pull server',
			options: [modeOpt],
			callback: async (a) => send({ action: 'hls', value: want(a.options.mode, s().out?.hls) }),
		},
		audio_mute: {
			name: 'Mute channel',
			options: [
				{ type: 'dropdown', id: 'channel', label: 'Channel', choices: channels, default: firstChannel },
				modeOpt,
			],
			callback: async (a) => {
				const cur = (s().audio ?? []).find((c) => c.id === a.options.channel)?.muted
				if (a.options.mode === 'toggle' || want(a.options.mode, cur) !== !!cur)
					await send({ action: 'mute', id: a.options.channel })
			},
		},
		audio_solo: {
			name: 'Solo channel',
			options: [
				{ type: 'dropdown', id: 'channel', label: 'Channel', choices: channels, default: firstChannel },
				modeOpt,
			],
			callback: async (a) => {
				const cur = (s().audio ?? []).find((c) => c.id === a.options.channel)?.solo
				if (a.options.mode === 'toggle' || want(a.options.mode, cur) !== !!cur)
					await send({ action: 'solo', id: a.options.channel })
			},
		},
		audio_gain: {
			name: 'Channel fader',
			options: [
				{ type: 'dropdown', id: 'channel', label: 'Channel', choices: channels, default: firstChannel },
				{
					type: 'number',
					id: 'gain',
					label: 'Gain (0 = silent, 1 = unity, 1.5 = max)',
					default: 1,
					min: 0,
					max: 1.5,
					step: 0.05,
				},
			],
			callback: async (a) => send({ action: 'gain', id: a.options.channel, value: Number(a.options.gain) }),
		},
		master_gain: {
			name: 'Master fader',
			options: [{ type: 'number', id: 'gain', label: 'Gain (0…1.5)', default: 1, min: 0, max: 1.5, step: 0.05 }],
			callback: async (a) => send({ action: 'master', value: Number(a.options.gain) }),
		},
		audio_follow: {
			name: 'Audio follows Program / manual',
			options: [
				{
					type: 'dropdown',
					id: 'mode',
					label: 'Mode',
					choices: [
						{ id: 'follow', label: 'Follow Program' },
						{ id: 'manual', label: 'Manual' },
					],
					default: 'follow',
				},
			],
			callback: async (a) => send({ action: 'audioMode', value: a.options.mode }),
		},
		ptz_recall: {
			name: 'PTZ: recall preset',
			description: 'Recall a stored position on a PTZ camera (NDI PTZ / VISCA-over-NDI).',
			options: [targetOpt, presetOpt],
			callback: async (a) =>
				send({ action: 'ptzRecall', target: String(a.options.target || 'program'), preset: Number(a.options.preset) }),
		},
		ptz_store: {
			name: 'PTZ: store preset',
			description: "Store the camera's current position into a preset number.",
			options: [targetOpt, presetOpt],
			callback: async (a) =>
				send({ action: 'ptzStore', target: String(a.options.target || 'program'), preset: Number(a.options.preset) }),
		},
		ptz_move: {
			name: 'PTZ: pan / tilt',
			description: 'Moves while held when used as press = direction, release = Stop (the presets do this).',
			options: [
				targetOpt,
				{ type: 'dropdown', id: 'direction', label: 'Direction', choices: PTZ_DIRECTIONS, default: 'up' },
				speedOpt,
			],
			callback: async (a) => {
				const [x, y] = PTZ_VECTORS[a.options.direction] ?? [0, 0]
				const v = Math.max(0, Math.min(1, Number(a.options.speed) || 0.6))
				await send({ action: 'ptzPanTilt', target: String(a.options.target || 'program'), pan: x * v, tilt: y * v })
			},
		},
		ptz_zoom: {
			name: 'PTZ: zoom',
			options: [
				targetOpt,
				{
					type: 'dropdown',
					id: 'direction',
					label: 'Direction',
					choices: [
						{ id: 'in', label: 'Zoom in (tele)' },
						{ id: 'out', label: 'Zoom out (wide)' },
						{ id: 'stop', label: 'Stop' },
					],
					default: 'in',
				},
				speedOpt,
			],
			callback: async (a) => {
				const v = Math.max(0, Math.min(1, Number(a.options.speed) || 0.6))
				const sign = a.options.direction === 'in' ? 1 : a.options.direction === 'out' ? -1 : 0
				await send({ action: 'ptzZoom', target: String(a.options.target || 'program'), speed: sign * v })
			},
		},
		show_start: {
			name: 'Run a Show: start',
			options: [
				{ type: 'checkbox', id: 'record', label: 'Record', default: true },
				{ type: 'checkbox', id: 'stream', label: 'Stream', default: true },
			],
			callback: async (a) => send({ action: 'startShow', record: !!a.options.record, stream: !!a.options.stream }),
		},
		show_next: { name: 'Run a Show: next step', options: [], callback: async () => send({ action: 'showNext' }) },
		show_step: {
			name: 'Run a Show: go to step',
			options: [{ type: 'number', id: 'index', label: 'Step (0 = first)', default: 0, min: 0, max: 200 }],
			callback: async (a) => send({ action: 'showStep', index: Number(a.options.index) }),
		},
		show_end: { name: 'Run a Show: end', options: [], callback: async () => send({ action: 'endShow' }) },
		talk: {
			name: 'Talkback (Down = on, Up = off for hold-to-talk)',
			options: [
				{
					type: 'dropdown',
					id: 'mode',
					label: 'Mode',
					choices: [
						{ id: 'on', label: 'On' },
						{ id: 'off', label: 'Off' },
					],
					default: 'on',
				},
			],
			callback: async (a) => send({ action: 'talkback', value: a.options.mode === 'on' }),
		},
		talk_target: {
			name: 'Talkback: who hears it',
			description:
				'auto = the satellite on air (every satellite when none is), all = broadcast, or a satellite source id.',
			options: [
				{
					type: 'dropdown',
					id: 'target',
					label: 'Talk to',
					choices: [
						{ id: 'auto', label: 'Satellite on air (auto)' },
						{ id: 'all', label: 'All satellites' },
					],
					default: 'auto',
					allowCustom: true,
				},
			],
			callback: async (a) => send({ action: 'talkTarget', value: String(a.options.target || 'auto') }),
		},
		message: {
			name: 'Message the satellites',
			options: [{ type: 'textinput', id: 'text', label: 'Text', default: 'Stand by', useVariables: true }],
			callback: async (a) => send({ action: 'message', text: String(a.options.text ?? ''), to: 'all' }),
		},
		quality: {
			name: 'Program resolution',
			options: [
				{
					type: 'dropdown',
					id: 'q',
					label: 'Resolution',
					choices: [
						{ id: '480p', label: '480p' },
						{ id: '720p', label: '720p' },
						{ id: '1080p', label: '1080p' },
					],
					default: '1080p',
				},
			],
			callback: async (a) => send({ action: 'quality', value: a.options.q }),
		},
		portrait: {
			name: 'Program orientation',
			options: [
				{
					type: 'dropdown',
					id: 'mode',
					label: 'Orientation',
					choices: [
						{ id: 'landscape', label: 'Landscape 16:9' },
						{ id: 'portrait', label: 'Portrait 9:16' },
					],
					default: 'landscape',
				},
			],
			callback: async (a) => send({ action: 'portrait', value: a.options.mode === 'portrait' }),
		},
		failover: {
			name: 'Auto switch-away when the on-air source drops',
			options: [modeOpt],
			callback: async (a) => send({ action: 'failover', on: want(a.options.mode, s().failoverOn) }),
		},
		failover_target: {
			name: 'Auto switch-away: fallback layout',
			options: [{ type: 'dropdown', id: 'layout', label: 'Switch to', choices: layoutOrPrev, default: '' }],
			callback: async (a) => send({ action: 'failover', target: a.options.layout ?? '' }),
		},
		monitor_mute: {
			name: 'Monitor audio (the device speaker)',
			options: [modeOpt],
			callback: async (a) => send({ action: 'monitorMute', value: want(a.options.mode, s().monMuted) }),
		},
		score_add: {
			name: 'Score: add points',
			description: "Add to a team's score. A negative number takes points off (for example -1 to correct a mistake).",
			options: [teamOpt, { type: 'number', id: 'value', label: 'Points', default: 1, min: -99, max: 99 }],
			callback: async (a) => scoreCall(`${a.options.team}/add?v=${encodeURIComponent(String(a.options.value))}`),
		},
		score_set: {
			name: "Score: set a team's score",
			options: [teamOpt, { type: 'number', id: 'value', label: 'Score', default: 0, min: 0, max: 999 }],
			callback: async (a) => scoreCall(`${a.options.team}/set?value=${encodeURIComponent(String(a.options.value))}`),
		},
		score_clock: {
			name: 'Score: game clock',
			description: 'Start, stop or toggle the clock, or reset it to the period length (0:00 on a count-up clock).',
			options: [
				{
					type: 'dropdown',
					id: 'mode',
					label: 'Clock',
					choices: [
						{ id: 'toggle', label: 'Start / stop (toggle)' },
						{ id: 'start', label: 'Start' },
						{ id: 'stop', label: 'Stop' },
						{ id: 'reset', label: 'Reset to the period length' },
					],
					default: 'toggle',
				},
			],
			callback: async (a) => {
				await scoreCall(`clock/${a.options.mode}`)
			},
		},
		score_clock_set: {
			name: 'Score: set the game clock',
			options: [{ type: 'textinput', id: 'time', label: 'Time (m:ss)', default: '10:00', useVariables: true }],
			callback: async (a) =>
				scoreCall(`clock/set?t=${encodeURIComponent(String(a.options.time).trim()).replace(/%3A/gi, ':')}`),
		},
		score_period: {
			name: 'Score: period',
			options: [
				{
					type: 'dropdown',
					id: 'dir',
					label: 'Move',
					choices: [
						{ id: 'next', label: 'Next period' },
						{ id: 'prev', label: 'Previous period' },
					],
					default: 'next',
				},
			],
			callback: async (a) => scoreCall(`period/${a.options.dir}`),
		},
		score_bug: {
			name: 'Score: bug on air',
			description: 'Show, hide or toggle the score bug: every score bug, or the one chosen.',
			options: [
				modeOpt,
				{
					type: 'dropdown',
					id: 'skin',
					label: 'Bug',
					choices: [{ id: '', label: 'All score bugs' }, ...skinChoices],
					default: '',
				},
			],
			callback: async (a) => {
				const skin = a.options.skin ? `${encodeURIComponent(a.options.skin)}/` : ''
				await scoreCall(`bug/${skin}${a.options.mode === 'on' ? 'show' : a.options.mode === 'off' ? 'hide' : 'toggle'}`)
			},
		},
		score_board: {
			name: 'Score: scoreboard layout',
			description: 'Cue the scoreboard layout to preview, or take it to Program.',
			options: [
				{
					type: 'dropdown',
					id: 'mode',
					label: 'Scoreboard',
					choices: [
						{ id: 'cue', label: 'Cue' },
						{ id: 'take', label: 'Take to Program' },
					],
					default: 'take',
				},
			],
			callback: async (a) => scoreCall(`board/${a.options.mode}`),
		},
		score_undo: { name: 'Score: undo', options: [], callback: async () => scoreCall('undo') },
		score_swap: { name: 'Score: swap sides', options: [], callback: async () => scoreCall('swap') },
		score_final: { name: 'Score: final (end the game)', options: [], callback: async () => scoreCall('final') },
		score_shot: {
			name: 'Score: shot clock',
			options: [
				{
					type: 'dropdown',
					id: 'mode',
					label: 'Shot clock',
					choices: [
						{ id: 'reset', label: 'Reset' },
						{ id: 'start', label: 'Start' },
						{ id: 'stop', label: 'Stop' },
					],
					default: 'reset',
				},
			],
			callback: async (a) => scoreCall(`shot/${a.options.mode}`),
		},
		fund_add: {
			name: 'Fundraiser: add a donation',
			description:
				'Amount in whole currency units (50 = $50; 12.5 is fine when the campaign has cents). The name is optional.',
			options: [
				{ type: 'number', id: 'amount', label: 'Amount', default: 50, min: 0.01, max: 100000000 },
				{ type: 'textinput', id: 'name', label: 'Donor name (blank = Anonymous)', default: '', useVariables: true },
			],
			callback: async (a) => {
				const name = String(String(a.options.name ?? '')).trim()
				await fundCall('add', { amount: Number(a.options.amount), ...(name ? { name } : {}) })
			},
		},
		fund_remove: {
			name: 'Fundraiser: remove an amount',
			description:
				'Take money off the total (a correction). Whole currency units; never goes below 0, never celebrates, and Undo brings it back. The note is optional.',
			options: [
				{ type: 'number', id: 'amount', label: 'Amount', default: 10, min: 0.01, max: 100000000 },
				{ type: 'textinput', id: 'name', label: 'Note (optional)', default: '', useVariables: true },
			],
			callback: async (a) => {
				const name = String(String(a.options.name ?? '')).trim()
				await fundCall('remove', { amount: Number(a.options.amount), ...(name ? { name } : {}) })
			},
		},
		fund_quick: {
			name: 'Fundraiser: quick donation',
			description: 'Add an anonymous donation of a preset amount.',
			options: [
				{
					type: 'dropdown',
					id: 'preset',
					label: 'Amount',
					choices: ['10', '50', '100', '500'].map((v) => ({ id: v, label: v })),
					default: '50',
				},
			],
			callback: async (a) => fundCall('add', { amount: Number(a.options.preset) }),
		},
		fund_undo: { name: 'Fundraiser: undo', options: [], callback: async () => fundCall('undo') },
		fund_set: {
			name: 'Fundraiser: correct the totals',
			description: 'Set the raised total (whole currency units) and/or the donor count. Leave a box blank to keep it.',
			options: [
				{ type: 'textinput', id: 'raised', label: 'Raised', default: '', useVariables: true },
				{ type: 'textinput', id: 'donors', label: 'Donors', default: '', useVariables: true },
			],
			callback: async (a) => {
				const raised = parseMajor(String(a.options.raised ?? ''))
				const donors = parseMajor(String(a.options.donors ?? ''))
				if (raised === undefined && donors === undefined) {
					self.log('warn', 'Fundraiser set: enter a raised total and/or a donor count')
					return
				}
				await fundCall('set', {
					...(raised !== undefined ? { raised } : {}),
					...(donors !== undefined ? { donors: Math.round(donors) } : {}),
				})
			},
		},
		fund_show: { name: 'Fundraiser: show on air', options: [], callback: async () => fundCall('show', { on: true }) },
		fund_hide: { name: 'Fundraiser: take off air', options: [], callback: async () => fundCall('show', { on: false }) },
		fund_toggle: {
			name: 'Fundraiser: show / hide (toggle)',
			options: [],
			callback: async () => fundCall('show', { on: !self.fund.bugOn }),
		},
		fund_mode: {
			name: 'Fundraiser: show gauge, numbers or both',
			options: [
				{
					type: 'dropdown',
					id: 'mode',
					label: 'Show',
					choices: [
						{ id: 'gauge', label: 'Gauge only' },
						{ id: 'numbers', label: 'Numbers only' },
						{ id: 'both', label: 'Gauge and numbers' },
					],
					default: 'both',
				},
			],
			callback: async (a) => fundCall('patch', { show: { as: a.options.mode } }),
		},
		fund_style: {
			name: 'Fundraiser: look (style and theme)',
			description:
				"Styles: A thermometer, B dial, C strip, D tote board. The theme must belong to the style (otherwise the style's first theme stays as it is).",
			options: [
				{
					type: 'dropdown',
					id: 'target',
					label: 'Change',
					choices: [
						{ id: 'bug', label: 'On-air bug' },
						{ id: 'layout', label: 'Full-screen layout' },
						{ id: 'both', label: 'Both' },
					],
					default: 'bug',
				},
				{
					type: 'dropdown',
					id: 'style',
					label: 'Style',
					choices: FUND_STYLES.map((s) => ({ id: s.id, label: `${s.letter} ${s.name}` })),
					default: 'strip',
				},
				{
					type: 'dropdown',
					id: 'theme',
					label: 'Theme',
					choices: [
						{ id: '', label: "Keep the style's current theme" },
						...FUND_STYLES.flatMap((s) => s.themes.map((t) => ({ id: t, label: `${s.letter} ${s.name}: ${t}` }))),
					],
					default: '',
				},
				{
					type: 'dropdown',
					id: 'pos',
					label: 'Bug corner',
					choices: [
						{ id: '', label: 'Keep' },
						{ id: 'tl', label: 'Top left' },
						{ id: 'tr', label: 'Top right' },
						{ id: 'bl', label: 'Bottom left' },
						{ id: 'br', label: 'Bottom right' },
					],
					default: '',
				},
			],
			callback: async (a) => {
				const style = fundStyleId(String(a.options.style))
				if (!style) {
					self.log('warn', `Fundraiser look: unknown style "${String(a.options.style)}"`)
					return
				}
				const theme = fundThemeFor(style, String(a.options.theme))
				if (a.options.theme && !theme)
					self.log('warn', `Fundraiser look: theme "${a.options.theme}" is not a ${style} theme`)
				const t = a.options.target
				if (t === 'bug' || t === 'both') {
					await fundCall('styleBug', {
						style,
						...(theme ? { theme } : {}),
						...(a.options.pos ? { pos: a.options.pos } : {}),
					})
				}
				if (t === 'layout' || t === 'both') await fundCall('styleLayout', { style, ...(theme ? { theme } : {}) })
			},
		},
		fund_celebrate: { name: 'Fundraiser: celebrate', options: [], callback: async () => fundCall('celebrate') },
		score_view: {
			name: 'Score: bug, full board or neither',
			description: 'One switch: the score bug over the show, the full-screen scoreboard, or neither.',
			options: [
				{
					type: 'dropdown',
					id: 'mode',
					label: 'Show',
					choices: [
						{ id: 'bug', label: 'Score bug' },
						{ id: 'board', label: 'Full board' },
						{ id: 'off', label: 'Neither' },
					],
					default: 'bug',
				},
			],
			callback: async (a) => scoreCall(`view/${a.options.mode}`),
		},
		score_scorer: {
			name: 'Score: who scored',
			description:
				'Shows "#10 Silva" under the score bug for 6 seconds. The player must be on that team\'s roster. Leave the number blank to clear.',
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
				{ type: 'textinput', id: 'n', label: 'Shirt number', default: '10', useVariables: true },
			],
			callback: async (a) => {
				const n = String(a.options.n ?? '').trim()
				await self.apiCall(
					'POST',
					'/api/score/scorer',
					n ? { team: a.options.team, n } : { team: a.options.team, n: '' },
				)
			},
		},
		score_player_add: {
			name: 'Score: add a player',
			description: 'Adds a player (number + name) to a team roster. An existing number gets the new name.',
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
				{ type: 'textinput', id: 'n', label: 'Shirt number (1-3 letters or digits)', default: '10' },
				{ type: 'textinput', id: 'name', label: 'Name', default: '' },
			],
			callback: async (a) => {
				await self.apiCall('POST', '/api/score/players/add', {
					team: a.options.team,
					n: String(a.options.n ?? '').trim(),
					name: String(a.options.name ?? '').trim(),
				})
			},
		},
		score_player_remove: {
			name: 'Score: remove a player',
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
				{ type: 'textinput', id: 'n', label: 'Shirt number', default: '10' },
			],
			callback: async (a) => {
				await self.apiCall('POST', '/api/score/players/remove', {
					team: a.options.team,
					n: String(a.options.n ?? '').trim(),
				})
			},
		},
		score_roster_set: {
			name: 'Score: set a team roster',
			description: 'Replaces the whole roster. One player per line or separated by ";": 10 Silva; 9 Costa; 7 Lima',
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
				{ type: 'textinput', id: 'list', label: 'Players', default: '10 Silva; 9 Costa' },
			],
			callback: async (a) => {
				const players = String(a.options.list ?? '')
					.split(/[;\n]/)
					.map((l) => l.trim().replace(/^#/, ''))
					.filter((l) => l)
					.map((l) => {
						const m = l.match(/^([0-9A-Za-z]{1,3})[\s,.:-]*(.*)$/)
						return m ? { n: m[1], name: m[2].trim() } : null
					})
					.filter((x) => x)
				await self.apiCall('POST', '/api/score/players', { team: a.options.team, players })
			},
		},
		score_setup: {
			name: 'Score: set up the game',
			description:
				'Sport, title, team names, short names, colours, periods and minutes a period. Blank boxes keep what is there. A different sport starts a new game.',
			options: [
				{
					type: 'dropdown',
					id: 'sport',
					label: 'Sport',
					choices: [
						{ id: '', label: 'Keep the sport' },
						{ id: 'basketball', label: 'Basketball' },
						{ id: 'soccer', label: 'Soccer' },
						{ id: 'afl', label: 'AFL' },
						{ id: 'netball', label: 'Netball' },
						{ id: 'volleyball', label: 'Volleyball' },
						{ id: 'generic', label: 'Other sport' },
					],
					default: '',
				},
				{ type: 'textinput', id: 'title', label: 'Title', default: '', useVariables: true },
				{ type: 'textinput', id: 'home', label: 'Home team', default: '', useVariables: true },
				{ type: 'textinput', id: 'homeShort', label: 'Home short name (blank = automatic)', default: '' },
				{ type: 'textinput', id: 'homeColor', label: 'Home colour (#RRGGBB)', default: '' },
				{ type: 'textinput', id: 'away', label: 'Away team', default: '', useVariables: true },
				{ type: 'textinput', id: 'awayShort', label: 'Away short name (blank = automatic)', default: '' },
				{ type: 'textinput', id: 'awayColor', label: 'Away colour (#RRGGBB)', default: '' },
				{ type: 'number', id: 'periods', label: 'Periods (0 = keep)', default: 0, min: 0, max: 20 },
				{ type: 'number', id: 'minutes', label: 'Minutes a period (0 = keep)', default: 0, min: 0, max: 120 },
			],
			callback: async (a) => {
				const o = a.options
				if (o.sport && o.sport !== self.score.game?.sport) await self.apiCall('POST', '/api/score', { sport: o.sport })
				const body: Record<string, unknown> = {}
				if (String(o.title ?? '').trim()) body.title = String(o.title).trim()
				for (const side of ['home', 'away'] as const) {
					const t: Record<string, string> = {}
					const name = String((side === 'home' ? o.home : o.away) ?? '').trim()
					const short = String((side === 'home' ? o.homeShort : o.awayShort) ?? '').trim()
					const color = String((side === 'home' ? o.homeColor : o.awayColor) ?? '').trim()
					if (name) t.name = name
					if (short) t.short = short
					if (color) t.color = color
					if (Object.keys(t).length) body[side] = t
				}
				if (Number(o.periods) > 0) body.rules = { periods: Number(o.periods) }
				if (Number(o.minutes) > 0) body.clock = { lenMs: Number(o.minutes) * 60000 }
				if (Object.keys(body).length) await self.apiCall('POST', '/api/score', body)
			},
		},
		fund_view: {
			name: 'Fundraiser: bar, full screen or neither',
			description: 'One switch: the fundraiser bar over the show, the full-screen appeal, or neither.',
			options: [
				{
					type: 'dropdown',
					id: 'mode',
					label: 'Show',
					choices: [
						{ id: 'bar', label: 'Bar over the show' },
						{ id: 'full', label: 'Full screen' },
						{ id: 'off', label: 'Neither' },
					],
					default: 'bar',
				},
			],
			callback: async (a) => fundCall('view', { to: a.options.mode }),
		},
		fund_setup: {
			name: 'Fundraiser: set up the appeal',
			description: 'Title, message, currency and the goals (whole currency units). Blank boxes keep what is there.',
			options: [
				{ type: 'textinput', id: 'title', label: 'Title', default: '', useVariables: true },
				{ type: 'textinput', id: 'desc', label: 'Message (e.g. a thank-you line)', default: '', useVariables: true },
				{ type: 'textinput', id: 'cur', label: 'Currency (3 letters, e.g. AUD)', default: '' },
				{ type: 'textinput', id: 'target', label: 'Goal', default: '', useVariables: true },
				{ type: 'textinput', id: 'min', label: 'First milestone', default: '', useVariables: true },
				{ type: 'textinput', id: 'stretch', label: 'Stretch goal', default: '', useVariables: true },
			],
			callback: async (a) => {
				const o = a.options
				const p: Record<string, unknown> = {}
				for (const k of ['title', 'desc', 'cur'] as const) if (String(o[k] ?? '').trim()) p[k] = String(o[k]).trim()
				for (const k of ['target', 'min', 'stretch'] as const) {
					const v = parseMajor(String(o[k] ?? ''))
					if (v !== undefined) p[k] = v
				}
				if (Object.keys(p).length) await fundCall('patch', p)
			},
		},
		wb_add: {
			name: 'Whiteboard: add a board',
			description: 'A full-screen whiteboard layout (white, grid paper, chalkboard) or a drawing over the show.',
			options: [
				{
					type: 'dropdown',
					id: 'kind',
					label: 'Board',
					choices: [
						{ id: 'white', label: 'White board (layout)' },
						{ id: 'grid', label: 'Grid paper (layout)' },
						{ id: 'chalk', label: 'Chalkboard (layout)' },
						{ id: 'drawing', label: 'Drawing over the show' },
					],
					default: 'white',
				},
			],
			callback: async (a) => {
				await self.apiCall('POST', '/api/whiteboard', { kind: a.options.kind })
			},
		},
		wb_do: {
			name: 'Whiteboard: clear, undo, redo, show or hide',
			description:
				'Show takes a whiteboard layout to Program (hide takes the one before it back); a drawing over the show plays or stops.',
			options: [
				boardOpt,
				{
					type: 'dropdown',
					id: 'op',
					label: 'Do',
					choices: [
						{ id: 'undo', label: 'Undo' },
						{ id: 'redo', label: 'Redo' },
						{ id: 'clear', label: 'Clear the page' },
						{ id: 'show', label: 'Show / take' },
						{ id: 'hide', label: 'Hide' },
					],
					default: 'undo',
				},
			],
			callback: async (a) => {
				const id = await boardId(String(a.options.board ?? ''))
				if (id) await self.apiCall('POST', `/api/whiteboard/${encodeURIComponent(id)}/${a.options.op}`)
			},
		},
		wb_stroke: {
			name: 'Whiteboard: draw a stroke',
			description:
				'Points as JSON [[x,y],…] from 0 to 1 (top-left is 0,0). Line, arrow, box and circle use the first and last point.',
			options: [
				boardOpt,
				{ type: 'textinput', id: 'points', label: 'Points', default: '[[0.2,0.5],[0.8,0.5]]', useVariables: true },
				{
					type: 'dropdown',
					id: 'tool',
					label: 'Tool',
					choices: ['pen', 'highlighter', 'line', 'arrow', 'box', 'circle'].map((t) => ({ id: t, label: t })),
					default: 'pen',
				},
				{
					type: 'textinput',
					id: 'color',
					label: 'Pen colour (#RRGGBB, blank = the board default)',
					default: '#E5484D',
				},
				{
					type: 'dropdown',
					id: 'size',
					label: 'Pen size',
					choices: [
						{ id: 'S', label: 'Small' },
						{ id: 'M', label: 'Medium' },
						{ id: 'L', label: 'Large' },
					],
					default: 'M',
				},
			],
			callback: async (a) => {
				const id = await boardId(String(a.options.board ?? ''))
				if (!id) return
				let points: unknown
				try {
					points = JSON.parse(String(a.options.points ?? '[]'))
				} catch {
					self.log('warn', 'Whiteboard stroke: points must be JSON like [[0.2,0.5],[0.8,0.5]]')
					return
				}
				const body: Record<string, unknown> = { points, tool: a.options.tool, size: a.options.size }
				if (String(a.options.color ?? '').trim()) body.color = String(a.options.color).trim()
				await self.apiCall('POST', `/api/whiteboard/${encodeURIComponent(id)}/stroke`, body)
			},
		},
		wb_page: {
			name: 'Whiteboard: page',
			options: [boardOpt, { type: 'textinput', id: 'page', label: 'Page (1, 2, … or new)', default: 'new' }],
			callback: async (a) => {
				const id = await boardId(String(a.options.board ?? ''))
				if (!id) return
				const v = String(a.options.page ?? '').trim()
				const n = v === 'new' ? 'new' : String(Math.max(0, (parseInt(v, 10) || 1) - 1))
				await self.apiCall('POST', `/api/whiteboard/${encodeURIComponent(id)}/page/${n}`)
			},
		},
		fb_login: {
			name: 'Facebook: log in',
			description:
				"Apple TV: shows a code + QR on the TV for facebook.com/device (also in the $(livedeck:fb_code) variable). iPhone/iPad: opens Facebook's login page on the device.",
			options: [{ type: 'checkbox', id: 'force', label: 'Even when signed in (switch account)', default: false }],
			callback: async (a) => {
				await self.apiCall('POST', '/api/facebook/login', a.options.force ? { force: true } : undefined)
			},
		},
		fb_login_cancel: {
			name: 'Facebook: cancel the login code',
			options: [],
			callback: async () => {
				await self.apiCall('POST', '/api/facebook/login/cancel')
			},
		},
		fb_target: {
			name: 'Facebook: where to go live',
			description: 'me = your timeline, or a Page id / a unique part of the Page name (see GET /api/facebook/targets).',
			options: [{ type: 'textinput', id: 'target', label: 'Timeline (me) or Page', default: 'me', useVariables: true }],
			callback: async (a) => {
				const t = String(a.options.target ?? '').trim()
				const body = t === '' || t === 'me' || /^\d+$/.test(t) ? { id: t || 'me' } : { name: t }
				await self.apiCall('POST', '/api/facebook/target', body)
			},
		},
		fb_privacy: {
			name: 'Facebook: who can see it (timeline)',
			options: [
				{
					type: 'dropdown',
					id: 'value',
					label: 'Audience',
					choices: [
						{ id: 'public', label: 'Public' },
						{ id: 'friends', label: 'Friends' },
						{ id: 'only_me', label: 'Only me' },
					],
					default: 'friends',
				},
			],
			callback: async (a) => {
				await self.apiCall('POST', '/api/facebook/privacy', { value: a.options.value })
			},
		},
		fb_details: {
			name: 'Facebook: title and description',
			options: [
				{ type: 'textinput', id: 'title', label: 'Title', default: '', useVariables: true },
				{ type: 'textinput', id: 'description', label: 'Description', default: '', useVariables: true },
			],
			callback: async (a) => {
				await self.apiCall('POST', '/api/facebook/details', {
					title: String(a.options.title ?? ''),
					description: String(a.options.description ?? ''),
				})
			},
		},
		fb_signout: {
			name: 'Facebook: sign out',
			description: 'Refused while Facebook is on air.',
			options: [],
			callback: async () => {
				await self.apiCall('POST', '/api/facebook/signout')
			},
		},
		fb_remember: {
			name: 'Facebook: go live without asking',
			description:
				'On = GO LIVE goes straight out to Facebook with the remembered target, audience and words (no "Go live on Facebook" sheet). Off = ask every time.',
			options: [modeOpt],
			callback: async (a) => {
				const on = want(a.options.mode, self.state.facebook ? !(self.state.facebook.askFirst ?? true) : undefined)
				await self.apiCall('POST', '/api/facebook/remember', { on })
			},
		},
		schedule_cancel_today: {
			name: "Schedule: cancel today's scheduled live",
			description: 'Cancels the scheduled live that is counting down (this time only; the schedule stays on).',
			options: [],
			callback: async () => {
				await self.apiCall('POST', '/api/schedules/cancel-today')
			},
		},
		schedule_enable: {
			name: 'Schedule: turn on/off',
			description: 'The schedule by its name (or id, from GET /api/schedules).',
			options: [
				{ type: 'textinput', id: 'schedule', label: 'Schedule name or id', default: '', useVariables: true },
				modeOpt,
			],
			callback: async (a) => {
				const name = String(a.options.schedule ?? '')
					.trim()
					.toLowerCase()
				if (!name) return
				const r = (await self.apiCall('GET', '/api/schedules')) as
					{ schedules?: { id: string; name?: string; displayName?: string; enabled?: boolean }[] } | undefined
				const list = r?.schedules ?? []
				const s =
					list.find((x) => x.id.toLowerCase() === name) ??
					list.find((x) => (x.displayName ?? x.name ?? '').toLowerCase() === name)
				if (!s) {
					self.log('warn', `No schedule called "${name}"`)
					return
				}
				const on = want(a.options.mode, s.enabled)
				await self.apiCall('POST', `/api/schedules/${encodeURIComponent(s.id)}/enable`, { on: on ? 1 : 0 })
			},
		},
		schedule_skip: {
			name: 'Schedule: skip the next run',
			description: 'The schedule by its name (or id). Skips only its next run.',
			options: [{ type: 'textinput', id: 'schedule', label: 'Schedule name or id', default: '', useVariables: true }],
			callback: async (a) => {
				const s = await findNamed(self, '/api/schedules', 'schedules', String(a.options.schedule ?? ''))
				if (s) await self.apiCall('POST', `/api/schedules/${encodeURIComponent(s.id)}/skip`)
			},
		},
		show_load: {
			name: 'Show: load a saved show',
			description:
				'Loads the show by its name (or id). Replaces the current layouts and sources; the Studio refuses while anything is on air.',
			options: [{ type: 'textinput', id: 'show', label: 'Show name or id', default: '', useVariables: true }],
			callback: async (a) => {
				const s = await findNamed(self, '/api/shows', 'shows', String(a.options.show ?? ''))
				if (s) await self.apiCall('POST', `/api/shows/${encodeURIComponent(s.id)}/load`)
			},
		},
		golive_retry: {
			name: 'GO LIVE: retry failed outputs',
			description: 'Retries every output that failed to go live.',
			options: [],
			callback: async () => {
				await self.apiCall('POST', '/api/golive/retry')
			},
		},
		crew_standby: {
			name: 'Crew: stand by (30 s countdown)',
			description: 'Tells one crew member (satellite or guest, by name or id) they are next.',
			options: [{ type: 'textinput', id: 'person', label: 'Name or id', default: '', useVariables: true }],
			callback: async (a) => {
				const c = await findNamed(self, '/api/crew', 'crew', String(a.options.person ?? ''))
				if (c) await self.apiCall('POST', `/api/crew/standby/${encodeURIComponent(c.id)}`)
			},
		},
		guest_kick: {
			name: 'Guests: remove a guest',
			description: 'Removes a connected guest (by name or id) from the show now.',
			options: [{ type: 'textinput', id: 'guest', label: 'Guest name or id', default: '', useVariables: true }],
			callback: async (a) => {
				const g = await findNamed(self, '/api/guests', 'guests', String(a.options.guest ?? ''))
				if (g) await self.apiCall('POST', `/api/guests/${encodeURIComponent(g.id)}/kick`)
			},
		},
		raw_command: {
			name: 'Raw command (advanced)',
			description: 'Any command from the Studio\'s /api docs page, as JSON, e.g. {"action":"cue","id":"…"}',
			options: [{ type: 'textinput', id: 'json', label: 'JSON', default: '{"action":"take"}', useVariables: true }],
			callback: async (a) => {
				let cmd: unknown
				try {
					cmd = JSON.parse(String(a.options.json ?? '{}'))
				} catch (e) {
					self.log('warn', `Raw command is not valid JSON: ${(e as Error).message}`)
					return
				}
				if (!cmd || typeof cmd !== 'object' || Array.isArray(cmd)) {
					self.log('warn', 'Raw command must be a JSON object with an "action"')
					return
				}
				await send(cmd as Record<string, unknown>)
			},
		},
	})
}

/** Look an item up by id or (display) name in a list route; logs and returns undefined when not found. */
async function findNamed(
	self: LiveDeckInstance,
	route: string,
	key: string,
	wanted: string,
): Promise<{ id: string } | undefined> {
	const name = wanted.trim().toLowerCase()
	if (!name) return undefined
	const r = (await self.apiCall('GET', route)) as Record<string, unknown> | undefined
	const list = (r?.[key] as { id: string; name?: string; displayName?: string }[] | undefined) ?? []
	const hit =
		list.find((x) => String(x.id).toLowerCase() === name) ??
		list.find((x) => (x.displayName ?? x.name ?? '').toLowerCase() === name)
	if (!hit) self.log('warn', `Nothing called "${wanted}" in ${route}`)
	return hit
}
