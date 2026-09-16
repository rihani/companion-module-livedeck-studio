import type { SomeCompanionConfigField } from '@companion-module/base'

export type LiveDeckConfig = {
	bonjour_host?: string | null
	host: string
	port: number
	token: string
	poll: boolean
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'static-text',
			id: 'info',
			width: 12,
			label: 'Studio',
			value:
				'On the Studio: Output → Web remote ON, then Output → Control API for the token. Pick the Studio found on the network, or type its address (port 8088 on iOS, 8090 on Android).',
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
			default: 8088,
			min: 1,
			max: 65535,
			isVisibleExpression: '!$(options:bonjour_host)',
		},
		{ type: 'textinput', id: 'token', label: 'API token', width: 8, default: '' },
		{ type: 'checkbox', id: 'poll', label: 'Poll every 2 s instead of the event stream', width: 4, default: false },
	]
}
