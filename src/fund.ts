/**
 * Fundraiser support: the campaign JSON the Studio keeps (FUND_CONTRACT §2) and the pure helpers that turn it
 * into text. Money in a REQUEST (`amount`, `raised`) is in MAJOR units; every money number the Studio sends back
 * (state, SSE) is an integer in MINOR units (`minor = major * 10^dec`), so display divides by 10^dec.
 */

export interface FundMilestone {
	k?: 'min' | 'target' | 'stretch' | string
	v?: number
	hit?: boolean
}
export interface FundRecent {
	n?: string
	a?: number
	t?: number
}
export interface FundCampaign {
	title?: string
	cur?: string
	dec?: number
	raised?: number
	min?: number
	target?: number
	stretch?: number
	donors?: number
	show?: { as?: string; on?: boolean; ticker?: boolean; celebrate?: boolean }
	look?: { style?: string; theme?: string; pos?: string }
	layout?: { style?: string; theme?: string }
	milestones?: FundMilestone[]
	recent?: FundRecent[]
	last?: { op?: string; a?: number; n?: string }
}
/** `GET /api/fund` and every fund write reply (minus `ok`); the web state and SSE key `fund` carry the same object. */
export interface FundState {
	fund?: FundCampaign
	serverNow?: number
	undoLabel?: string
	undoDepth?: number
	bugOn?: boolean
	layoutOn?: boolean
}
export interface FundSkin {
	id: string
	name?: string
	layoutId?: string
	/** idle | in | held | out — `in` and `held` mean on air. */
	phase?: string
}

export const fundSkinOnAir = (k: FundSkin | undefined): boolean => k?.phase === 'in' || k?.phase === 'held'

/** Style ids with their letters, and the theme ids of each (the shared table `fund_styles.json`). */
export const FUND_STYLES: { id: string; letter: string; name: string; themes: string[] }[] = [
	{ id: 'thermo', letter: 'A', name: 'Thermometer', themes: ['emerald', 'coral', 'ocean'] },
	{ id: 'dial', letter: 'B', name: 'Radial dial', themes: ['neon', 'sunset', 'mono'] },
	{ id: 'strip', letter: 'C', name: 'Progress strip', themes: ['frost', 'paper', 'royal'] },
	{ id: 'tote', letter: 'D', name: 'Tote board', themes: ['gold', 'led-red', 'felt-green'] },
]

/** `A`..`D` or `thermo`..`tote` (any case) to the style id; undefined when unknown. */
export function fundStyleId(v: string | undefined): string | undefined {
	const t = String(v ?? '')
		.trim()
		.toLowerCase()
	return FUND_STYLES.find((s) => s.id === t || s.letter.toLowerCase() === t)?.id
}

/** The theme id when it belongs to the style, else undefined (the Studio answers 400 for a mismatch). */
export function fundThemeFor(style: string, theme: string | undefined): string | undefined {
	const t = String(theme ?? '')
		.trim()
		.toLowerCase()
	return FUND_STYLES.find((s) => s.id === style)?.themes.find((x) => x === t)
}

const SYMBOLS: Record<string, string> = {
	AUD: '$',
	USD: '$',
	CAD: '$',
	NZD: '$',
	EUR: '€',
	GBP: '£',
	AED: 'AED ',
	SAR: 'SAR ',
	EGP: 'E£ ',
	TRY: '₺',
	INR: '₹',
	PKR: 'Rs ',
}

/** Currency symbol; an unknown code shows as `<CODE> `. */
export function currencySymbol(cur: string | undefined): string {
	const c = String(cur ?? 'AUD').toUpperCase()
	return SYMBOLS[c] ?? `${c} `
}

/** Minor units to display text: symbol, thousands separators, `dec` decimals (`1845000`, dec 2 -> `$18,450.00`). */
export function formatMoney(
	minor: number | undefined,
	dec: number | undefined,
	cur: string | undefined,
	locale?: string,
): string {
	const d = dec === 2 ? 2 : 0
	const major = (minor ?? 0) / 10 ** d
	return `${currencySymbol(cur)}${major.toLocaleString(locale, { minimumFractionDigits: d, maximumFractionDigits: d })}`
}

/** Whole percent of the target raised (rounded down so 99.6% never reads 100); 0 without a target. */
export function fundPct(raised: number | undefined, target: number | undefined): number {
	if (!target || target <= 0) return 0
	return Math.max(0, Math.floor(((raised ?? 0) / target) * 100))
}

export const milestoneHit = (c: FundCampaign | undefined, k: 'min' | 'target' | 'stretch'): boolean =>
	!!c?.milestones?.some((m) => m.k === k && m.hit)

/** `Fatima A. $100` from the newest ticker entry; blank until a donation has been seen. */
export function latestText(c: FundCampaign | undefined): string {
	const r = c?.recent?.[c.recent.length - 1]
	if (!r) return ''
	return `${r.n || 'Anonymous'} ${formatMoney(r.a, c?.dec, c?.cur)}`
}

/** A major-units number typed in an option; undefined for blank or not a finite number. */
export function parseMajor(v: string | number | undefined): number | undefined {
	const t = String(v ?? '').trim()
	if (t === '') return undefined
	const n = Number(t)
	return Number.isFinite(n) ? n : undefined
}

/** Variable values for the fund state; empty until a campaign has been seen. */
export function fundVariableValues(f: FundState): Record<string, string | number> {
	const c = f.fund
	if (!c) return {}
	const money = (m: number | undefined): string => formatMoney(m, c.dec, c.cur)
	return {
		fund_raised: money(c.raised),
		fund_pct: fundPct(c.raised, c.target),
		fund_target: money(c.target),
		fund_togo: money(Math.max(0, (c.target ?? 0) - (c.raised ?? 0))),
		fund_donors: c.donors ?? 0,
		fund_latest: latestText(c),
		fund_undo_label: f.undoLabel ?? '',
	}
}
