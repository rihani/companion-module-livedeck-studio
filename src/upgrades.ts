import type { CompanionStaticUpgradeScript } from '@companion-module/base'
import type { LiveDeckConfig, LiveDeckSecrets } from './config.js'

/** 0.2.0: the API token moves from the plain config into the connection secrets. */
const moveTokenToSecrets: CompanionStaticUpgradeScript<LiveDeckConfig, LiveDeckSecrets> = (_context, props) => {
	const config = props.config
	if (!config || typeof config.token !== 'string' || config.token === '') {
		return { updatedConfig: null, updatedSecrets: null, updatedActions: [], updatedFeedbacks: [] }
	}
	const secrets: LiveDeckSecrets = { ...(props.secrets ?? {}) }
	if (!secrets.token) secrets.token = config.token
	const { token: _old, ...rest } = config
	return { updatedConfig: rest, updatedSecrets: secrets, updatedActions: [], updatedFeedbacks: [] }
}

export const UpgradeScripts: CompanionStaticUpgradeScript<LiveDeckConfig, LiveDeckSecrets>[] = [moveTokenToSecrets]
