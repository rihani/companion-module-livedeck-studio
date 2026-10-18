import type {
	CompanionButtonStepActions,
	CompanionPresetDefinitions,
	CompanionPresetSection,
	CompanionSimplePresetDefinition,
} from '@companion-module/base'
import type { GoLiveOutput, PtzDirection } from './actions.js'
import { AMBER, BLACK, BLUE, GREEN, RED, WHITE } from './feedbacks.js'
import type LiveDeckInstance from './main.js'
import type { ModuleSchema } from './main.js'

const DARK = 0x0e1730
const PTZ_BG = 0x1d2b4f
/** Presets reference variables with the module's shortname; Companion rewrites it to the connection label. */
const V = (name: string): string => `$(livedeck-studio:${name})`
const PTZ_PRESETS = 8

type Preset = CompanionSimplePresetDefinition<ModuleSchema>
type Step = CompanionButtonStepActions<ModuleSchema>

const press = (down: Step['down'], up: Step['up'] = []): Step[] => [{ down, up }]

export function UpdatePresets(self: LiveDeckInstance): void {
	const p: CompanionPresetDefinitions<ModuleSchema> = {}
	const add = (id: string, preset: Preset): string => {
		p[id] = preset
		return id
	}

	// ---- GO LIVE ----
	const goLive = [
		add('go_live', {
			type: 'simple',
			name: 'GO LIVE',
			keywords: ['start', 'on air', 'broadcast'],
			style: { text: 'GO\nLIVE', size: '18', color: WHITE, bgcolor: DARK },
			steps: press([{ actionId: 'go_live', options: { mode: 'on' } }]),
			feedbacks: [{ feedbackId: 'live', options: {}, style: { bgcolor: RED, color: WHITE, text: '● LIVE' } }],
		}),
		add('stop_live', {
			type: 'simple',
			name: 'Stop live (hold 2 s)',
			keywords: ['stop', 'end', 'off air'],
			style: { text: 'STOP\nhold 2 s', size: '14', color: WHITE, bgcolor: DARK },
			steps: [
				{
					down: [],
					up: [],
					2000: { options: { runWhileHeld: true }, actions: [{ actionId: 'go_live', options: { mode: 'off' } }] },
				},
			],
			feedbacks: [{ feedbackId: 'live', options: {}, style: { bgcolor: RED, color: WHITE } }],
		}),
	]
	const selection: [GoLiveOutput, string][] = [
		['ndi', 'NDI'],
		['rtmp', 'STREAM'],
		['record', 'REC'],
		['hls', 'HLS'],
		['rtmpServer', 'RTMP\nSERVER'],
	]
	const goLiveSelect = selection.map(([output, label]) =>
		add(`go_live_select_${output}`, {
			type: 'simple',
			name: `GO LIVE includes ${label.replace('\n', ' ')}`,
			style: { text: `☐ ${label}`, size: '14', color: WHITE, bgcolor: DARK },
			steps: press([{ actionId: 'go_live_select', options: { output, mode: 'toggle' } }]),
			feedbacks: [
				{
					feedbackId: 'go_live_selected',
					options: { output },
					style: { bgcolor: BLUE, color: WHITE, text: `☑ ${label}` },
				},
			],
		}),
	)

	// ---- Layouts ----
	const takeIds: string[] = []
	const cueIds: string[] = []
	for (const l of self.state.layouts ?? []) {
		takeIds.push(
			add(`take_${l.id}`, {
				type: 'simple',
				name: `Take ${l.name}`,
				style: { text: l.name, size: 'auto', color: WHITE, bgcolor: DARK },
				steps: press([{ actionId: 'layout_take', options: { layout: l.id, style: '' } }]),
				feedbacks: [
					{ feedbackId: 'layout_cued', options: { layout: l.id }, style: { bgcolor: GREEN, color: BLACK } },
					{ feedbackId: 'layout_live', options: { layout: l.id }, style: { bgcolor: RED, color: WHITE } },
					{
						feedbackId: 'layout_offline',
						options: { layout: l.id },
						style: { bgcolor: AMBER, color: BLACK, text: `${l.name}\nOFFLINE` },
					},
				],
			}),
		)
		cueIds.push(
			add(`cue_${l.id}`, {
				type: 'simple',
				name: `Cue ${l.name}`,
				style: { text: `CUE\n${l.name}`, size: 'auto', color: WHITE, bgcolor: DARK },
				steps: press([{ actionId: 'layout_cue', options: { layout: l.id } }]),
				feedbacks: [
					{ feedbackId: 'layout_cued', options: { layout: l.id }, style: { bgcolor: GREEN, color: BLACK } },
					{ feedbackId: 'layout_live', options: { layout: l.id }, style: { bgcolor: RED, color: WHITE } },
				],
			}),
		)
	}

	// ---- Switching ----
	const switching = [
		add('take', {
			type: 'simple',
			name: 'Take',
			style: { text: 'TAKE', size: '24', color: WHITE, bgcolor: DARK },
			steps: press([{ actionId: 'take', options: { style: '' } }]),
			feedbacks: [],
		}),
		add('cut', {
			type: 'simple',
			name: 'Cut',
			style: { text: 'CUT', size: '24', color: WHITE, bgcolor: DARK },
			steps: press([{ actionId: 'cut', options: {} }]),
			feedbacks: [],
		}),
	]

	// ---- Outputs ----
	const outputs = [
		add('record', {
			type: 'simple',
			name: 'Record',
			style: { text: 'REC', size: '24', color: WHITE, bgcolor: DARK },
			steps: press([{ actionId: 'record', options: { mode: 'toggle' } }]),
			feedbacks: [
				{ feedbackId: 'recording', options: {}, style: { bgcolor: RED, color: WHITE } },
				{ feedbackId: 'rec_silent', options: {}, style: { bgcolor: AMBER, color: BLACK, text: 'REC\nNO AUDIO' } },
			],
		}),
		add('stream', {
			type: 'simple',
			name: 'Stream',
			style: { text: 'STREAM', size: '18', color: WHITE, bgcolor: DARK },
			steps: press([{ actionId: 'stream', options: { mode: 'toggle' } }]),
			feedbacks: [
				{ feedbackId: 'stream_connecting', options: {}, style: { bgcolor: AMBER, color: BLACK } },
				{ feedbackId: 'streaming', options: {}, style: { bgcolor: GREEN, color: BLACK } },
			],
		}),
		add('ndi', {
			type: 'simple',
			name: 'NDI output',
			style: { text: 'NDI', size: '24', color: WHITE, bgcolor: DARK },
			steps: press([{ actionId: 'ndi_out', options: { mode: 'toggle' } }]),
			feedbacks: [{ feedbackId: 'ndi_out', options: {}, style: { bgcolor: GREEN, color: BLACK } }],
		}),
		add('hls', {
			type: 'simple',
			name: 'HLS pull server',
			style: { text: 'HLS', size: '24', color: WHITE, bgcolor: DARK },
			steps: press([{ actionId: 'hls', options: { mode: 'toggle' } }]),
			feedbacks: [{ feedbackId: 'hls', options: {}, style: { bgcolor: GREEN, color: BLACK } }],
		}),
	]

	// ---- PTZ (the on-air camera; change the Camera option for a fixed one) ----
	const ptzPresets: string[] = []
	for (let n = 1; n <= PTZ_PRESETS; n++) {
		ptzPresets.push(
			add(`ptz_preset_${n}`, {
				type: 'simple',
				name: `PTZ preset ${n} (hold 2 s to store)`,
				keywords: ['camera', 'recall', 'position'],
				style: { text: `PTZ\nPRESET ${n}`, size: '14', color: WHITE, bgcolor: PTZ_BG },
				steps: [
					{
						down: [],
						up: [{ actionId: 'ptz_recall', options: { target: 'program', preset: n } }],
						2000: {
							options: { runWhileHeld: true },
							actions: [{ actionId: 'ptz_store', options: { target: 'program', preset: n } }],
						},
					},
				],
				feedbacks: [],
			}),
		)
	}
	const arrows: [PtzDirection, string][] = [
		['upleft', '↖'],
		['up', '▲'],
		['upright', '↗'],
		['left', '◀'],
		['right', '▶'],
		['downleft', '↙'],
		['down', '▼'],
		['downright', '↘'],
	]
	const ptzMove = arrows.map(([direction, glyph]) =>
		add(`ptz_move_${direction}`, {
			type: 'simple',
			name: `PTZ ${direction} (hold)`,
			keywords: ['camera', 'pan', 'tilt'],
			style: { text: glyph, size: '30', color: WHITE, bgcolor: PTZ_BG },
			steps: press(
				[{ actionId: 'ptz_move', options: { target: 'program', direction, speed: 0.6 } }],
				[{ actionId: 'ptz_move', options: { target: 'program', direction: 'stop', speed: 0.6 } }],
			),
			feedbacks: [],
		}),
	)
	const ptzZoom = (['in', 'out'] as const).map((direction) =>
		add(`ptz_zoom_${direction}`, {
			type: 'simple',
			name: `PTZ zoom ${direction} (hold)`,
			keywords: ['camera', 'zoom'],
			style: { text: direction === 'in' ? 'ZOOM\n＋' : 'ZOOM\n－', size: '18', color: WHITE, bgcolor: PTZ_BG },
			steps: press(
				[{ actionId: 'ptz_zoom', options: { target: 'program', direction, speed: 0.6 } }],
				[{ actionId: 'ptz_zoom', options: { target: 'program', direction: 'stop', speed: 0.6 } }],
			),
			feedbacks: [],
		}),
	)

	// ---- Run a Show ----
	const show = [
		add('show_start', {
			type: 'simple',
			name: 'Start show',
			style: { text: 'START\nSHOW', size: '18', color: WHITE, bgcolor: DARK },
			steps: press([{ actionId: 'show_start', options: { record: true, stream: true } }]),
			feedbacks: [],
		}),
		add('show_next', {
			type: 'simple',
			name: 'Next step',
			style: { text: `NEXT\n${V('rundown_step')}`, size: '18', color: WHITE, bgcolor: DARK },
			steps: press([{ actionId: 'show_next', options: {} }]),
			feedbacks: [],
		}),
		add('show_end', {
			type: 'simple',
			name: 'End show',
			style: { text: 'END\nSHOW', size: '18', color: WHITE, bgcolor: DARK },
			steps: press([{ actionId: 'show_end', options: {} }]),
			feedbacks: [],
		}),
	]

	// ---- Talkback ----
	const talk = [
		add('talk', {
			type: 'simple',
			name: 'Talk (hold)',
			keywords: ['intercom', 'IFB', 'talkback'],
			style: { text: 'TALK', size: '24', color: WHITE, bgcolor: DARK },
			steps: press([{ actionId: 'talk', options: { mode: 'on' } }], [{ actionId: 'talk', options: { mode: 'off' } }]),
			feedbacks: [],
		}),
		add('talk_target_auto', {
			type: 'simple',
			name: 'Talk to the satellite on air',
			style: { text: 'TALK TO\nON AIR', size: '14', color: WHITE, bgcolor: DARK },
			steps: press([{ actionId: 'talk_target', options: { target: 'auto' } }]),
			feedbacks: [],
		}),
		add('talk_target_all', {
			type: 'simple',
			name: 'Talk to all satellites',
			style: { text: 'TALK TO\nALL', size: '14', color: WHITE, bgcolor: DARK },
			steps: press([{ actionId: 'talk_target', options: { target: 'all' } }]),
			feedbacks: [],
		}),
	]

	// ---- Status ----
	const status = [
		add('on_air', {
			type: 'simple',
			name: 'On air',
			style: { text: `ON AIR\n${V('live_layout')}`, size: '14', color: WHITE, bgcolor: DARK },
			steps: press([]),
			feedbacks: [{ feedbackId: 'live', options: {}, style: { bgcolor: RED, color: WHITE } }],
		}),
		add('health', {
			type: 'simple',
			name: 'Health',
			style: { text: `CPU ${V('cpu')}%\n${V('health')}`, size: '14', color: WHITE, bgcolor: DARK },
			steps: press([]),
			feedbacks: [
				{ feedbackId: 'health_warn', options: {}, style: { bgcolor: AMBER, color: BLACK } },
				{ feedbackId: 'health_bad', options: {}, style: { bgcolor: RED, color: WHITE } },
			],
		}),
		add('failover', {
			type: 'simple',
			name: 'Auto switch-away',
			style: { text: 'AUTO\nSWITCH', size: '14', color: WHITE, bgcolor: DARK },
			steps: press([{ actionId: 'failover', options: { mode: 'toggle' } }]),
			feedbacks: [{ feedbackId: 'failover_on', options: {}, style: { bgcolor: BLUE, color: WHITE } }],
		}),
	]

	// ---- Score ----
	const scoreBtn = (
		id: string,
		name: string,
		text: string,
		actionId: string,
		options: Record<string, unknown>,
		feedbacks: Preset['feedbacks'] = [],
		size: '14' | '18' | '24' = '14',
	): string =>
		add(id, {
			type: 'simple',
			name,
			keywords: ['score', 'scoreboard'],
			style: { text, size, color: WHITE, bgcolor: DARK },
			steps: press([{ actionId, options } as never]),
			feedbacks,
		})
	const teams = [
		['home', 'Home'],
		['away', 'Away'],
	] as const
	const scoreTeamKeys = Object.fromEntries(
		teams.map(([team, label]) => [
			team,
			[
				scoreBtn(
					`score_${team}_show`,
					`${label} score`,
					`${V(`${team}_short`)}\n${V(`score_${team}`)}`,
					'score_add',
					{ team, value: 1 },
					[{ feedbackId: 'score_leading', options: { team }, style: { bgcolor: GREEN, color: BLACK } }],
					'18',
				),
				...[1, 2, 3].map((n) =>
					scoreBtn(`score_${team}_p${n}`, `${label} +${n}`, `${label.toUpperCase()}\n+${n}`, 'score_add', {
						team,
						value: n,
					}),
				),
				scoreBtn(`score_${team}_m1`, `${label} -1`, `${label.toUpperCase()}\n-1`, 'score_add', { team, value: -1 }),
			],
		]),
	)
	const scoreClock = [
		scoreBtn(
			'score_clock_toggle',
			'Clock start / stop',
			V('clock'),
			'score_clock',
			{ mode: 'toggle' },
			[{ feedbackId: 'score_clock_running', options: {}, style: { bgcolor: GREEN, color: BLACK } }],
			'24',
		),
		scoreBtn('score_clock_reset', 'Clock reset to period length', 'CLOCK\nRESET', 'score_clock', { mode: 'reset' }),
		scoreBtn('score_period_next', 'Next period', `PERIOD\n${V('period_label')} >`, 'score_period', { dir: 'next' }, [
			{ feedbackId: 'score_in_break', options: {}, style: { bgcolor: AMBER, color: BLACK } },
		]),
		scoreBtn('score_period_prev', 'Previous period', '< PERIOD', 'score_period', { dir: 'prev' }),
		scoreBtn('score_shot_reset', 'Shot clock reset', `SHOT\n${V('shot')}`, 'score_shot', { mode: 'reset' }),
	]
	const scoreOnAir = [
		scoreBtn(
			'score_bug_toggle',
			'Score bug on / off',
			'SCORE\nBUG',
			'score_bug',
			{ mode: 'toggle', skin: '' },
			[{ feedbackId: 'score_bug_on', options: { skin: '' }, style: { bgcolor: RED, color: WHITE } }],
			'18',
		),
		scoreBtn('score_board_cue', 'Cue the scoreboard', 'BOARD\nCUE', 'score_board', { mode: 'cue' }),
		scoreBtn(
			'score_board_take',
			'Take the scoreboard',
			'BOARD\nTAKE',
			'score_board',
			{ mode: 'take' },
			[{ feedbackId: 'score_board_on', options: {}, style: { bgcolor: RED, color: WHITE } }],
			'18',
		),
	]
	const scoreBugs = self.scoreSkins.map((k) => {
		const label = k.name || k.style || k.id
		return add(`score_bug_${k.id}`, {
			type: 'simple',
			name: `Bug: ${label}`,
			keywords: ['score', 'bug', label],
			style: { text: `BUG\n${label}`, size: '14', color: WHITE, bgcolor: DARK },
			steps: press([{ actionId: 'score_bug', options: { mode: 'toggle', skin: k.id } }]),
			feedbacks: [{ feedbackId: 'score_bug_on', options: { skin: k.id }, style: { bgcolor: RED, color: WHITE } }],
		})
	})
	const scoreGame = [
		scoreBtn('score_undo', 'Undo', `UNDO\n${V('undo_label')}`, 'score_undo', {}),
		scoreBtn('score_swap', 'Swap sides', 'SWAP\nSIDES', 'score_swap', {}),
		scoreBtn('score_final', 'Final', 'FINAL', 'score_final', {}, [
			{ feedbackId: 'score_final', options: {}, style: { bgcolor: AMBER, color: BLACK } },
		]),
	]

	const structure: CompanionPresetSection<ModuleSchema>[] = [
		{
			id: 'golive',
			name: 'GO LIVE',
			definitions: [
				{
					id: 'golive',
					type: 'simple',
					name: 'GO LIVE / stop',
					description: 'GO LIVE starts every ticked output together; Stop needs a 2-second hold.',
					presets: goLive,
				},
				{
					id: 'golive_select',
					type: 'simple',
					name: 'What GO LIVE starts',
					description: 'Blue = ticked. Changes the selection only.',
					presets: goLiveSelect,
				},
			],
		},
		{
			id: 'layouts',
			name: 'Layouts',
			definitions: [
				{
					id: 'take',
					type: 'simple',
					name: 'Take to Program',
					description:
						'One button per layout: green when cued, red on air, amber when its source dropped. Connect to the Studio to see them.',
					presets: takeIds,
				},
				{ id: 'cue', type: 'simple', name: 'Cue', presets: cueIds },
			],
		},
		{
			id: 'switching',
			name: 'Switching',
			definitions: [{ id: 'sw', type: 'simple', name: 'Take / Cut', presets: switching }],
		},
		{
			id: 'outputs',
			name: 'Outputs',
			definitions: [{ id: 'out', type: 'simple', name: 'Record / Stream / NDI / HLS', presets: outputs }],
		},
		{
			id: 'ptz',
			name: 'PTZ',
			definitions: [
				{
					id: 'ptz_presets',
					type: 'simple',
					name: 'Presets',
					description: 'Tap to recall on the on-air PTZ camera, hold 2 s to store the current position.',
					presets: ptzPresets,
				},
				{ id: 'ptz_move', type: 'simple', name: 'Pan / tilt (hold)', presets: ptzMove },
				{ id: 'ptz_zoom', type: 'simple', name: 'Zoom (hold)', presets: ptzZoom },
			],
		},
		{
			id: 'show',
			name: 'Run a Show',
			definitions: [{ id: 'show', type: 'simple', name: 'Show control', presets: show }],
		},
		{
			id: 'satellites',
			name: 'Talkback',
			definitions: [{ id: 'sat', type: 'simple', name: 'Talkback', presets: talk }],
		},
		{
			id: 'score',
			name: 'Score',
			definitions: [
				{
					id: 'score_home',
					type: 'simple',
					name: 'Home team',
					description: 'The first button shows the score and goes green while the team leads.',
					presets: scoreTeamKeys.home,
				},
				{ id: 'score_away', type: 'simple', name: 'Away team', presets: scoreTeamKeys.away },
				{
					id: 'score_clock',
					type: 'simple',
					name: 'Clock and period',
					description: 'The clock button shows the time (ticks here, no network chatter) and is green while it runs.',
					presets: scoreClock,
				},
				{ id: 'score_air', type: 'simple', name: 'Bug and scoreboard', presets: scoreOnAir },
				{
					id: 'score_bugs',
					type: 'simple',
					name: 'One bug each',
					description: 'One button per score bug in the Studio (red while on air). Connect to the Studio to see them.',
					presets: scoreBugs,
				},
				{ id: 'score_game', type: 'simple', name: 'Game', presets: scoreGame },
			],
		},
		{
			id: 'status',
			name: 'Status & settings',
			definitions: [{ id: 'st', type: 'simple', name: 'Status', presets: status }],
		},
	]
	self.setPresetDefinitions(structure, p)
}
