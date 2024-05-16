import { twitchUserInfo } from './twitch'

var channel_emotes = new Map()
var global_emotes = new Map()

export function getFFEmoteImg(id) {
	let e = channel_emotes.get(id)
	if (!e) e = global_emotes.get(id)
	return e
}

export function initFF() {
	return Promise.all([
		getFFGlobalEmotes(),
		getFFChannelEmotes(twitchUserInfo.user_id),
	])
}

export function getFFGlobalEmotes() {
	let promise = new Promise((resolve, reject) => {
		let lEmotes = new Map()
		fetch('https://api.frankerfacez.com/v1/set/global')
			.then((response) => response.json())
			.then((data) => {
				for (const [key, value] of Object.entries(data.sets)) {
					value.emoticons.forEach((e) => {
						let img = e.urls['4']
						lEmotes.set(e.name, `${img}`)
					})
				}
			})
			.finally(() => {
				global_emotes = lEmotes
				resolve()
			})
	})
	return promise
}

export function getFFChannelEmotes(user_id) {
	let promise = new Promise((resolve, reject) => {
		let lEmotes = new Map()
		fetch(`https://api.frankerfacez.com/v1/room/id/${user_id}`)
			.then((response) => response.json())
			.then((data) => {
				for (const [key, value] of Object.entries(data.sets)) {
					value.emoticons.forEach((e) => {
						let img = e.urls['4']
						lEmotes.set(e.name, `${img}`)
					})
				}
			})
			.finally(() => {
				channel_emotes = lEmotes
				resolve()
			})
	})
	return promise
}
