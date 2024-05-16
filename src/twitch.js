import { twitch_botlist } from './botlist.js'
import { Client } from 'tmi.js'

var glogal_badge_sets = new Object()
var channel_badge_sets = new Object()

export var twitchCallback = new Object()

export var token
// export var gClientId
// export var gUserId
export var isTokenValid

export var twitchUserInfo = {
	user_id: '',
	login: '',
	client_id: '',
	status: '',
}

// export function setToken(_var) {
// 	token = _var
// }

export function getEmoteImg(emoteId) {
	return `<img class="chatEmote" src="https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/3.0">`
}

export function getTwitchChannelBadge(key) {
	return channel_badge_sets[key]
}

export function getTwitchGlobalBadge(key) {
	return glogal_badge_sets[key]
}

export async function initTwitch(_token) {
	token = _token
	if (token) {
		if (token.startsWith('oauth:')) {
			if (develop === 1) localStorage.setItem('twitchChatToken', token)
		} else {
			console.log('token should start with "oauth:"')
			token = ''
		}
	} else token = localStorage.getItem('twitchChatToken')

	if (token != '' && token != null) {
		twitchUserInfo = await getUserInfos(token)
		if (twitchUserInfo.status != 200) {
			console.log('invalid token, please provide a valid token')
		} else {
			isTokenValid = true

			return true
		}
	} else console.log('please provide a valid token')
	return false
}

export async function getChannelBadges(user_id) {
	return new Promise((resolve, reject) => {
		fetch(
			`https://api.twitch.tv/helix/chat/badges?broadcaster_id=${twitchUserInfo.user_id}`,
			{
				headers: new Headers({
					Authorization: 'Bearer ' + token.split(':')[1],
					'Client-Id': twitchUserInfo.client_id,
				}),
			}
		)
			.then((response) => {
				// status = response.status
				return response.json()
			})
			.then((data) => {
				// data.status = status
				channel_badge_sets = {}
				for (let e of data.data) {
					channel_badge_sets[e.set_id] = { versions: e.versions }
				}
			})
			.catch((error) => {
				// console.log(error);
			})
			.finally(() => {
				resolve(new Map())
			})
	})
}

export async function getGlobalBadges(user_id) {
	return new Promise((resolve, reject) => {
		fetch(`https://api.twitch.tv/helix/chat/badges/global`, {
			headers: new Headers({
				Authorization: 'Bearer ' + token.split(':')[1],
				'Client-Id': twitchUserInfo.client_id,
			}),
		})
			.then((response) => {
				// status = response.status
				return response.json()
			})
			.then((data) => {
				// data.status = status
				glogal_badge_sets = {}
				for (let e of data.data) {
					glogal_badge_sets[e.set_id] = { versions: e.versions }
				}
			})
			.catch((error) => {
				// console.log(error);
			})
			.finally(() => {
				resolve(new Map())
			})
	})
}

export function start_chat(login, client_id) {
	var botmap = new Map()
	twitch_botlist.bots.forEach((e) => {
		botmap.set(e[0], true)
	})
	if (typeof customBot != 'undefined')
		customBot.forEach((e) => {
			botmap.set(e, true)
		})

	if (typeof whiteListBot != 'undefined')
		whiteListBot.forEach((e) => {
			botmap.delete(e)
		})

	if (token != '') {
		const client = new Client({
			options: {
				debug: true,
				// messagesLogLevel: "info",
				debug: false,
				clientId: client_id,
			},
			connection: {
				reconnect: true,
				secure: true,
			},
			identity: {
				username: login,
				password: token,
			},
			channels: [login],
		})
		client.connect().catch(console.error)

		client.on('emotesets', (sets, obj) => {})

		client.on('clearchat', (channel) => {
			twitchCallback.clearchat(channel)
		})

		client.on(
			'messagedeleted',
			(channel, _username2, deletedMessage, userstate) =>
				twitchCallback.clearchat(channel, _username2, deletedMessage, userstate)
		)

		client.on('announcement', (channel, tags, message, self, color) => {
			if (botmap.get(tags['login'])) return

			twitchCallback.announcement(channel, tags, message, self, color)
		})

		client.on('message', (channel, userstate, message, self) => {
			if (botmap.get(userstate['username'])) return

			twitchCallback.message(channel, userstate, message, self)
		})
	}
}

function getUserInfos(token) {
	let status
	return fetch(`https://id.twitch.tv/oauth2/validate`, {
		headers: new Headers({
			Authorization: 'Bearer ' + token.split(':')[1],
		}),
	})
		.then((response) => {
			status = response.status
			return response.json()
		})
		.then((data) => {
			data.status = status
			return data
		})
		.catch((error) => {
			// console.log(error);
		})
}
