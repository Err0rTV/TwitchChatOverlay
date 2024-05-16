import ReconnectingEventSource from 'reconnecting-eventsource'

import { twitchUserInfo } from './twitch'

var evtSource

var SevenTV_emotes_set_id

var channel_emotes = new Map()
var global_emotes = new Map()

export function get7TVEmoteImg(id) {
	let e = channel_emotes.get(id)
	if (!e) e = global_emotes.get(id)
	return e
}

export function init7TV() {
	return Promise.all([
		get7TVGlobalEmotes(),
		get7TVChannelEmotes(twitchUserInfo.user_id),

		new Promise((resolve, reject) => {
			if (SevenTV_emotes_set_id) {
				evtSource = new ReconnectingEventSource(
					`https://events.7tv.io/v3@emote_set.update%3Cobject_id=${SevenTV_emotes_set_id}%3E`
				)
				evtSource.onmessage = function (e) {
					//						console.log('message')
					//						console.log(e)
				}
				evtSource.onerror = (e) => {
					//						console.log(e)
				}
				evtSource.onopen = (e) => {
					//						console.log(e)
				}
				evtSource.addEventListener('heartbeat', (event) => {
					// console.log("notice")
					// console.log(event)
				})
				evtSource.addEventListener('dispatch', (event) => {
					//						console.log('emote_set.update')
					//						console.log(event)

					let data = JSON.parse(event.data)
					if (data.type == 'emote_set.update') {
						setTimeout(() => {
							get7TVGlobalEmotes()
							get7TVChannelEmotes(twitchUserInfo.user_id)
						}, 1000)
					}
				})
			}
			resolve()
		}),
	])
}
export function get7TVGlobalEmotes() {
	let promise = new Promise((resolve, reject) => {
		let lEmotes = new Map()
		fetch('https://7tv.io/v3/emote-sets/global')
			.then((response) => response.json())
			.then((data) => {
				data.emotes.forEach((e) => {
					lEmotes.set(
						e.name,
						'https:' +
							e.data.host.url +
							'/' +
							e.data.host.files
								.filter((value, index) => value.name === '4x.webp')
								.at(0).name
					)
				})
			})
			.finally(() => {
				global_emotes = lEmotes
				resolve()
			})
	})
	return promise
}

export function get7TVChannelEmotes(user_id) {
	let promise = new Promise((resolve, reject) => {
		let lEmotes = new Map()
		fetch(`https://7tv.io/v3/users/twitch/${user_id}`)
			.then((response) => response.json())
			.then((data) => {
				SevenTV_emotes_set_id = data.emote_set?.id
				data.emote_set?.emotes?.forEach((e) => {
					lEmotes.set(
						e.name,
						'https:' +
							e.data.host.url +
							'/' +
							e.data.host.files
								.filter((value, index) => value.name === '4x.webp')
								.at(0).name
					)
				})
			})
			.finally(() => {
				channel_emotes = lEmotes
				resolve()
			})
	})
	return promise
}
