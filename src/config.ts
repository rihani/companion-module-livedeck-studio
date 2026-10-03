import type { SomeCompanionConfigField } from '@companion-module/base'

export type LiveDeckConfig = {
	bonjour_host?: string | null
	host: string
	port: number
	poll: boolean
	/** Before 0.2.0 the token lived in the plain config; the upgrade script moves it to the secrets. */
	token?: string
}

export type LiveDeckSecrets = {
	token?: string
}

export const DEFAULT_PORT = 8088

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'static-text',
			id: 'info',
			width: 12,
			label: 'Studio',
			value:
				'In LiveDeck: Output → Web remote ON, then Output → Control API to copy the API token. Pick the Studio found on the network, or type its address and port (8088 by default on iOS / iPadOS / Mac, 8090 on Android — use the port shown on the Web remote card).',
		},
		{ type: 'bonjour-device', id: 'bonjour_host', label: 'Studio on this network', width: 6 },
		{
			type: 'textinput',
			id: 'host',
			label: 'Address',
			width: 4,
			default: '',
			isVisibleExpression: '!$(options:bonjour_host)',
		},
		{
			type: 'number',
			id: 'port',
			label: 'Port',
			width: 2,
			default: DEFAULT_PORT,
			min: 1,
			max: 65535,
			isVisibleExpression: '!$(options:bonjour_host)',
		},
		{
			type: 'secret-text',
			id: 'token',
			label: 'API token',
			tooltip: 'LiveDeck → Output → Control API. Regenerate it there if it was ever shared.',
			width: 8,
			default: '',
		},
		{ type: 'checkbox', id: 'poll', label: 'Poll every 2 s instead of the event stream', width: 4, default: false },
	]
}
