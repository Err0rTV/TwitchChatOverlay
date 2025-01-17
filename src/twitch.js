import { twitch_botlist } from './botlist.js'
import { Client } from 'tmi.js'
import { toInt, getOption, escapeTag, choose_user_color } from './misc.js'
import { add, delMsg } from './OBSTwitchChat.js'

import { getBetterTTVEmoteImg } from './betterttv.js'
import { getFFEmoteImg } from './frankerzface.js'
import { get7TVEmoteImg } from './seventv.js'

var glogal_badge_sets = new Object()
var channel_badge_sets = new Object()

var testMode

const annouceBadge = document.getElementById('announceBadge').innerHTML

export var twitchCallback = new Object()

export var token
export var isTokenValid

export var twitchUserInfo = {
	user_id: '',
	login: '',
	client_id: '',
	status: '',
}

var develop

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

export async function initTwitch() {
	testMode = toInt(getOption('testMode'), 0, 'testMode maybe 0, 1 or 2')

	token = getOption('token')
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
			let ul = document.getElementById('test')
			ul.innerHTML = '<div style="height: 200vw;"></div>'
		})

		client.on(
			'messagedeleted',
			(channel, _username2, deletedMessage, userstate) =>
				delMsg(userstate['target-msg-id'])
		)

		client.on('announcement', (channel, tags, message, self, color) => {
			if (botmap.get(tags['login'])) return

			showMsg({
				channel: channel,
				userstate: tags,
				message: message,
				self: self,
				color: color,
			})
		})

		client.on('message', (channel, userstate, message, self) => {
			if (botmap.get(userstate['username'])) return

			// filter unwanted messages
			if (userstate['message-type'] === 'whisper') return

			if (message.charAt(0) === '!') return

			showMsg({
				channel: channel,
				userstate: userstate,
				message: message,
				self: self,
			})
		})
	}
	if (testMode == 1) testmsg()
	if (testMode == 2) testannounce()
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

async function testmsg() {
	const dumyText =
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue. Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede. Praesent blandit odio eu enim. Pellentesque sed dui ut augue blandit sodales. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam nibh. Mauris ac mauris sed pede pellentesque fermentum. Maecenas adipiscing ante non diam sodales hendrerit.'

	let testMsg = {
		channel: '#syntax_err0r',
		userstate: {
			'badge-info': null,
			color: null,
			'display-name': dumyText
				.replace(' ', '')
				.substring(0, 4 + Math.random() * 21),
			emotes: null,
			'first-msg': false,
			flags: null,
			id: '6b526ea6-29bc-42b0-a235-0cc4aec6c36b',
			mod: false,
			'returning-chatter': false,
			'room-id': '237719570',
			subscriber: false,
			'tmi-sent-ts': '1657319410322',
			turbo: false,
			'user-id': Math.round(Math.random() * 1000),
			'user-type': null,
			'emotes-raw': '41:79-86',
			'badge-info-raw': null,
			'badges-raw': 'vip/1',
			username: dumyText.replace(' ', '').substring(0, 4 + Math.random() * 21),
			'message-type': 'chat',
		},
		// message: dumyText.substring(0, 1 + Math.random() * 50),
		message:
			'LuL LuL LuL LuL LuL LuL LuL LuL LuL LuL LuL LuL LuL LuL LuL LuL LuL LuL LuL LuL LuL LuL LuL LuL LuL LuL LuL LuL LuL LuL LuL LuL LuL LuL LuL LuL LuL LuL LuL LuL ',
		self: false,
	}

	if (isTokenValid) {
		testMsg.userstate.badges = {
			broadcaster: '1',
			subscriber: '12',
		}
	}

	showMsg(testMsg)

	var t = setTimeout(() => {
		testmsg()
	}, 100 + Math.random() * 15000)
}

async function testannounce() {
	const dumyText =
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue. Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede. Praesent blandit odio eu enim. Pellentesque sed dui ut augue blandit sodales. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam nibh. Mauris ac mauris sed pede pellentesque fermentum. Maecenas adipiscing ante non diam sodales hendrerit.'

	let testMsg = {
		channel: '#syntax_err0r',
		userstate: {
			'badge-info': null,
			color: null,
			'display-name': dumyText
				.replace(' ', '')
				.substring(0, 4 + Math.random() * 21),
			emotes: null,
			flags: null,
			id: '2588d8e5-bb11-43b3-adf3-e2213f149ce2',
			login: dumyText.replace(' ', '').substring(0, 4 + Math.random() * 21),
			mod: false,
			'msg-id': 'announcement',
			'msg-param-color': 'PRIMARY',
			'room-id': '237719570',
			subscriber: true,
			'system-msg': null,
			'tmi-sent-ts': '1657319131524',
			'user-id': Math.round(Math.random() * 1000),
			'user-type': null,
			'emotes-raw': null,
			'badge-info-raw': 'subscriber/27',
			'badges-raw': 'broadcaster/1,subscriber/12',
			'message-type': 'announcement',
		},
		message: dumyText.substring(0, 1 + Math.random() * 50),
		self: false,
		color: 'PRIMARY',
	}

	if (isTokenValid) {
		testMsg.userstate.badges = {
			broadcaster: '1',
			subscriber: '12',
		}
	}

	showMsg(testMsg)

	var t = setTimeout(() => {
		testannounce()
	}, 100 + Math.random() * 15000)
}

/**
 * @brief Processes and displays a Twitch message with badges, emotes, and clips.
 *
 * This asynchronous function takes a Twitch message object, processes its badges, emotes,
 * and clip URLs, and then constructs an HTML representation of the message. The message
 * is then displayed in the chat window.
 *
 * @param twitchMsg The Twitch message object containing user state and message text.
 * @param twitchMsg.channel The channel where the message was sent.
 * @param twitchMsg.userstate An object containing user state information and message metadata.
 * @param twitchMsg.userstate.badge-info Additional information about the user's badges.
 * @param twitchMsg.userstate.color The color of the user's name in chat. (#177DE3)
 * @param twitchMsg.userstate.display-name The display name of the user.
 * @param twitchMsg.userstate.emotes An object containing information about the emotes in the message ({ '499': [ '3-4' ] }),
 *                       where the key is the emote ID and the value is an array of ranges.
 * @param twitchMsg.userstate.first-msg Indicates if this is the user's first message in the chat.
 * @param twitchMsg.userstate.flags Any flags associated with the message.
 * @param twitchMsg.userstate.id A unique identifier for the message. (c5ddcb05-85ae-4a60-91bc-7704c7031257)
 * @param twitchMsg.userstate.mod Indicates if the user is a moderator.
 * @param twitchMsg.userstate.returning-chatter Indicates if the user is a returning chatter.
 * @param twitchMsg.userstate.room-id The unique identifier for the chat room.
 * @param twitchMsg.userstate.subscriber Indicates if the user is a subscriber.
 * @param twitchMsg.userstate.tmi-sent-ts The timestamp when the message was sent.
 * @param twitchMsg.userstate.turbo Indicates if the user has Turbo.
 * @param twitchMsg.userstate.user-id The unique identifier for the user.
 * @param twitchMsg.userstate.user-type The type of user (mod, global mod, admin, or staff).
 * @param twitchMsg.userstate.emotes-raw The raw emote data.
 * @param twitchMsg.userstate.badge-info-raw The raw badge info data.
 * @param twitchMsg.userstate.badges-raw The raw badges data.
 * @param twitchMsg.userstate.username The username of the user.
 * @param twitchMsg.userstate.message-type The type of message (chat, whisper, action, announcement, etc.).
 * @param twitchMsg.message The content of the message.
 * @param twitchMsg.self Indicates if the message was sent by the user themselves.
 */
async function showMsg(twitchMsg) {

	let htmlBadges = document.createElement('span')
	let message = document.createElement('span')

	// badges
	if (twitchMsg.userstate.badges != null) {
		// if (Object.keys(twitchMsg.userstate.badges).length > 0)
		// 	htmlBadges += "<span class=''>"

		Object.entries(twitchMsg.userstate.badges).forEach(([key, value]) => {
			let badge
			let badgeImg
			// console.log(key + " : " + value)
			if (getTwitchChannelBadge(key) != null) {
				badge = getTwitchChannelBadge(key)
				let version = badge.versions.filter((e) => e.id === value)[0]
				if (version != undefined) badgeImg = version.image_url_4x
				else {
					badgeImg = getTwitchGlobalBadge(key).versions.filter(
						(e) => e.id === value
					)[0].image_url_4x
				}
			} else {
				badgeImg = getTwitchGlobalBadge(key)?.versions.filter(
					(e) => e.id === value
				)[0].image_url_4x
			}
			let img = document.createElement('img')
			img.src = badgeImg
			img.classList.add('chatEmote')
			htmlBadges.appendChild(img)
		})

		// if (Object.keys(twitchMsg.userstate.badges).length > 0)
		// 	htmlBadges += `</span>`
	}

	let url = await fetchClipUrl(twitchMsg.message)
	if (url != null) {
		let video = document.createElement('video')
		video.src = url
		video.loop = true
		video.autoplay = true
		video.muted = true
		message.appendChild(video)
	} else {
		// twitch emotes processing
		///////////////////////////////////////////////////////////////
		let tokens = String(twitchMsg.message).match(
			/[\w]+|[^\r\n\t \f\v]+|[\r\n\t \f\v]+/g
		)
		let tokens2 = []
		let pos = 0

		for (let e of tokens) {
			tokens2.push({ str: e, start: pos, end: pos + e.length - 1 })
			pos += e.length
		}

		for (let e of tokens2) {
			if (twitchMsg.userstate.emotes != null)
				for (let emote of Object.entries(twitchMsg.userstate.emotes)) {
					if (emote[1] == e.start + '-' + e.end) {
						e.type = 'emote'
						e.img = `https://static-cdn.jtvnw.net/emoticons/v2/${emote[0]}/default/dark/3.0`
						break
					}
				}
			if (Object.hasOwn(e, 'type')) continue
			let img = getBetterTTVEmoteImg(e.str)
			if (!img) img = get7TVEmoteImg(e.str)
			if (!img) img = getFFEmoteImg(e.str)
			if (img) {
				e.type = 'emote'
				e.img = img
				continue
			}
			e.type = 'text'
		}

		for (let e of tokens2) {
			if (e.type == 'text') message.append(e.str)
			else if (e.type == 'emote') {
				let img = document.createElement('img')
				img.src = e.img
				img.classList.add('chatEmote')
				message.appendChild(img)
			}
		}

		// bttv emotes processing
		let regex = /([^.;, \n]+)/gm
		function f(correspondance, p1, decalage, chaine) {
			let img = getBetterTTVEmoteImg(correspondance)
			if (!img) img = get7TVEmoteImg(correspondance)
			if (!img) img = getFFEmoteImg(correspondance)

			if (img) {
				img = `<img class="chatEmote" src="${img}">`
				return img
			} else return correspondance
		}

		twitchMsg.message = twitchMsg.message.replace(regex, f)
	}

	if (twitchMsg.userstate['message-type'] == 'action')
		twitchMsg.message = `<i>${twitchMsg.message}</i>`

	// HTML element creation
	let messagebox = document
		.getElementById('messagebox-template')
		.content.firstElementChild.cloneNode(true) //.namedItem("contener").cloneNode(true)

	if (messagebox != null) {
		let text = messagebox.getElementsByClassName('text')[0]
		text.style.color = twitchMsg.userstate.color
			? twitchMsg.userstate.color
			: choose_user_color(twitchMsg.userstate['user-id'])

		let username = document.createElement('span')
		if (twitchMsg.userstate['user-id'] == '741565995') {
			username.append(
				`<span class="block-line"><span><span style="color:#ff0000;">l</span><span style="color:#ffaa00;">e</span><span style="color:#aaff00;">s</span><span style="color:#00ff00;">m</span><span style="color:#00ffaa;">a</span><span style="color:#00aaff;">l</span><span style="color:#0000ff;">o</span><span style="color:#aa00ff;">u</span><span style="color:#ff00aa;">s</span></span></span>`
			)
		} else {
			username.append(twitchMsg.userstate['display-name'])
		}
		messagebox.getElementsByClassName('announce')[0]

		messagebox.getElementsByClassName('name')[0].appendChild(username)
		messagebox.getElementsByClassName('name')[0].style.color = twitchMsg
			.userstate.color
			? twitchMsg.userstate.color
			: choose_user_color(twitchMsg.userstate['user-id'])
		messagebox.getElementsByClassName('msg')[0].appendChild(message)
		messagebox.getElementsByClassName('htmlBadges')[0].appendChild(htmlBadges)

		add(twitchMsg.userstate.id, messagebox)
	}
}

/**
 * @brief Fetches the URL of a Twitch clip from a given message.
 *
 * This asynchronous function extracts a clip slug from a Twitch URL within the
 * provided message, then attempts to fetch the corresponding clip URL up to three times.
 * If the clip URL is found, it is returned; otherwise, the function returns null.
 *
 * @param[in] message The message containing the Twitch clip URL.
 * @return A promise that resolves to the URL of the Twitch clip in MP4 format, or null if not found.
 */
export async function fetchClipUrl(message) {
	const regex = [
		/^https:\/\/www.twitch.tv\/.+\/clip\/(.+)$/gm,
		/^https:\/\/clips.twitch.tv\/(.+)$/gm,
	]

	message = message.replace('http://', 'https://')
	message = message.replace(/\?.*/, '')

	let slug = ''

	regex.forEach((element) => {
		let m = element.exec(message)
		if (m != null) {
			slug = m[1]
		}
	})

	if (slug != '') {
		let url

		for (let c = 1; c <= 3; c++) {
			let response = await fetch(`https://clips.twitch.tv/${slug}`).catch(
				(error) => {}
			)

			if (response == undefined) {
				console.log(
					"can't fetch clip, launch obs with --disable-web-security parameter"
				)
				return null
			}

			let data = await response.text()

			let position = String(data).indexOf('property="og:image"')
			if (position != -1) {
				let start = String(data).lastIndexOf('<meta', position)
				let end = String(data).indexOf('>', position)
				let m = String(data).substring(start, end + 1)

				m = m.match(/content="(.*?)"/)
				if (m) {
					url = m[1].replace('-social-preview.jpg', '.mp4')
					// console.log(url)
					return url
				}
			}
			console.log('retry ' + c)
			await new Promise((r) => setTimeout(r, 2000))
		}
	}
	return null
}
