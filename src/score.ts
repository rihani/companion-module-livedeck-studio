/**
 * Scoreboard support: the game JSON the Studio keeps (SCOREBOARD_SPEC §3), and the pure helpers that turn it
 * into text (clock, period label, status word). The Studio is the only clock: it sends `ms` at the moment `at`
 * and whether it `run`s, so every reader works the current value out itself.
 */

export interface ScoreTeam {
	name?: string
	short?: string
	color?: string
	score?: number
	players?: { n: string; name?: string }[]
}
export interface ScoreClock {
	dir?: 'down' | 'up' | 'none' | string
	lenMs?: number
	ms?: number
	run?: boolean
	at?: number
}
export interface ScoreGame {
	sport?: string
	title?: string
	home?: ScoreTeam
	away?: ScoreTeam
	period?: number
	brk?: boolean
	final?: boolean
	clock?: ScoreClock
	shot?: ScoreClock & { on?: boolean }
	rules?: { periods?: number; half?: number; label?: string; cont?: boolean }
	scorer?: { team?: string; n?: string; name?: string; t?: number }
}
/** `GET /api/score` and every score write reply (minus `ok`); the web state and SSE key `sc` carry the same object. */
export interface ScoreState {
	game?: ScoreGame
	serverNow?: number
	undoLabel?: string
	/** A bug is VISIBLE on Program. */
	bugOn?: boolean
	/** A bug is on Program (or fixed) but hidden because a Scoreboard board is live. */
	bugSuppressed?: boolean
	boardOn?: boolean
}
export interface ScoreSkin {
	id: string
	name?: string
	style?: string
	/** idle | in | held | out — `in` and `held` mean on air. */
	phase?: string
	/** Hidden by the live Scoreboard board (owner rule 2026-10-19). */
	suppressed?: boolean
	layoutId?: string
}
export interface ScoreBoard {
	id: string
	name?: string
	shows?: string
	live?: boolean
	cued?: boolean
}

/** On air = playing AND not hidden by its own board layout (`suppressed`). */
export const skinOnAir = (k: ScoreSkin | undefined): boolean =>
	(k?.phase === 'in' || k?.phase === 'held') && !k?.suppressed

const pad2 = (n: number): string => String(n).padStart(2, '0')
const mmss = (totalSec: number): string => `${Math.floor(totalSec / 60)}:${pad2(totalSec % 60)}`

/** The clock's value in ms right now; `skew` = Studio time minus local time. */
export function clockMs(c: ScoreClock | undefined, localNow: number, skew: number): number {
	if (!c || c.ms === undefined) return 0
	if (!c.run || c.at === undefined) return c.ms
	const elapsed = Math.max(0, localNow + skew - c.at)
	return c.dir === 'up' ? c.ms + elapsed : Math.max(0, c.ms - elapsed)
}

/** `7:42`; a down clock under a minute shows tenths (`59.9`); an up clock past the period end reads `45:00 +1:12`. */
export function clockText(g: ScoreGame | undefined, localNow: number, skew: number): string {
	const c = g?.clock
	if (!c || c.dir === 'none') return ''
	const ms = clockMs(c, localNow, skew)
	if (c.dir === 'up') {
		const len = c.lenMs ?? 0
		const end = g?.rules?.cont ? len * (g?.period ?? 1) : len
		if (end > 0 && ms >= end) return `${mmss(Math.floor(end / 1000))} +${mmss(Math.floor((ms - end) / 1000))}`
		return mmss(Math.floor(ms / 1000))
	}
	if (ms > 0 && ms < 60000) return (Math.floor(ms / 100) / 10).toFixed(1)
	return mmss(Math.ceil(ms / 1000))
}

/** Shot clock: whole seconds, tenths under 5 s; blank when it is off. */
export function shotText(g: ScoreGame | undefined, localNow: number, skew: number): string {
	const s = g?.shot
	if (!s || !s.on) return ''
	const ms = clockMs({ ...s, dir: 'down' }, localNow, skew)
	return ms < 5000 ? (Math.floor(ms / 100) / 10).toFixed(1) : String(Math.ceil(ms / 1000))
}

export function periodLabel(g: ScoreGame | undefined): string {
	if (!g) return ''
	const n = g.period ?? 1
	const sport = (g.sport ?? '').toLowerCase()
	const periods = g.rules?.periods ?? 4
	const over = (word: string): string => (n - periods <= 1 ? word : `${word}${n - periods}`)
	if (sport === 'volleyball') return `SET ${n}`
	if (sport === 'soccer') return n <= periods ? `${n}H` : over('ET')
	if (sport === 'basketball' || sport === 'afl' || sport === 'netball') return n <= periods ? `Q${n}` : over('OT')
	const label = g.rules?.label ?? 'P'
	return label.length <= 2 ? `${label}${n}` : `${label} ${n}`
}

/** FINAL / HALF TIME / END OF Q3 … or blank while play is on. */
export function statusText(g: ScoreGame | undefined): string {
	if (!g) return ''
	const sport = (g.sport ?? '').toLowerCase()
	if (g.final) {
		if (sport === 'soccer' || sport === 'afl' || sport === 'netball') return 'FULL TIME'
		return sport === 'volleyball' ? 'MATCH' : 'FINAL'
	}
	if (!g.brk) return ''
	const n = g.period ?? 1
	if (n === (g.rules?.half ?? 2)) return 'HALF TIME'
	if (sport === 'afl' && n === 1) return 'QUARTER TIME'
	if (sport === 'afl' && n === 3) return 'THREE QUARTER TIME'
	return `END OF ${periodLabel(g)}`
}

/** Variable values for the score state; empty until a game has been seen. */
export function scoreVariableValues(
	sc: ScoreState,
	localNow: number,
	skew: number,
	skins: ScoreSkin[] = [],
): Record<string, string | number> {
	const g = sc.game
	if (!g) return {}
	const cur = (g.clock?.dir ?? 'none') !== 'none'
	return {
		score_home: g.home?.score ?? 0,
		score_away: g.away?.score ?? 0,
		home_name: g.home?.name ?? '',
		away_name: g.away?.name ?? '',
		home_short: g.home?.short ?? '',
		away_short: g.away?.short ?? '',
		last_scorer: g.scorer?.n ? `#${g.scorer.n}${g.scorer.name ? ' ' + g.scorer.name : ''}` : '',
		clock: clockText(g, localNow, skew),
		clock_running: cur && g.clock?.run ? 'Yes' : 'No',
		shot: shotText(g, localNow, skew),
		period: g.period ?? 1,
		period_label: periodLabel(g),
		status: statusText(g),
		sport: g.sport ?? '',
		game_title: g.title ?? '',
		undo_label: sc.undoLabel ?? '',
		bug_on: sc.bugOn || skins.some(skinOnAir) ? 'Yes' : 'No',
		board_on: sc.boardOn ? 'Yes' : 'No',
	}
}
