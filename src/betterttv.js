import { twitchUserInfo } from './twitch'

var socket

var channel_emotes = new Map()
var global_emotes = new Map()

var updateCount = 0

export function getBetterTTVEmoteImg(id) {
	let e = channel_emotes.get(id)
	if (!e) e = global_emotes.get(id)
	return e
}

export function initBTTV() {
	return Promise.all([
		getBTTVGlobalEmotes(),
		getBTTVChannelEmotes(twitchUserInfo.user_id),

		new Promise((resolve, reject) => {
			socket = new WebSocket('wss://sockets.betterttv.net/ws')
			socket.onmessage = (event) => {
				let data = JSON.parse(event.data)
				if (
					data.name == 'emote_update' ||
					data.name == 'emote_delete' ||
					data.name == 'emote_create'
				) {
					updateCount++
					setTimeout(() => {
						if (updateCount == 1) {
							getBTTVGlobalEmotes()
							getBTTVChannelEmotes(twitchUserInfo.user_id)
						}
						updateCount--
					}, 360000)
				}
			}
			socket.onopen = () => {
				socket.send(
					JSON.stringify({
						name: 'join_channel',
						data: { name: `twitch:${twitchUserInfo.user_id}` },
					})
				)
			}
			socket.onerror = (e) => {
				//					console.log(e)
			}
			socket.onclose = (e) => {
				//					console.log(e)
			}
			resolve()
		}),
	])
}

export function getBTTVGlobalEmotes() {
	let promise = new Promise((resolve, reject) => {
		let lEmotes = new Map()
		fetch('https://api.betterttv.net/3/cached/emotes/global')
			.then((response) => response.json())
			.then((data) => {
				data.forEach((e) => {
					lEmotes.set(e.code, `https://cdn.betterttv.net/emote/${e.id}/3x`)
				})
			})
			.finally(() => {
				global_emotes = lEmotes
				resolve()
			})
	})
	return promise
}

export function getBTTVChannelEmotes(user_id) {
	let promise = new Promise((resolve, reject) => {
		let lEmotes = new Map()
		fetch(`https://api.betterttv.net/3/cached/users/twitch/${user_id}`)
			.then((response) => {
				// console.log(response.status);
				if (response.status == 200) return response.json()
				else return { channelEmotes: Array(), sharedEmotes: Array() }
			})
			.then((data) => {
				data.channelEmotes.forEach((e) => {
					lEmotes.set(e.code, `https://cdn.betterttv.net/emote/${e.id}/3x`)
				})
				data.sharedEmotes.forEach((e) => {
					lEmotes.set(e.code, `https://cdn.betterttv.net/emote/${e.id}/3x`)
				})
			})
			.finally(() => {
				channel_emotes = lEmotes
				resolve()
			})
	})
	return promise
}
