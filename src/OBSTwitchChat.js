import {
	start_chat,
	twitchCallback,
	getEmoteImg,
	isTokenValid,
	twitchUserInfo,
	getChannelBadges,
	getGlobalBadges,
	getTwitchChannelBadge,
	getTwitchGlobalBadge,
	initTwitch,
} from './twitch.js'
import { initBTTV, getBetterTTVEmoteImg } from './betterttv.js'
import { initFF, getFFEmoteImg } from './frankerzface.js'
import { init7TV, get7TVEmoteImg } from './seventv.js'

var messagesHideDelay
var testMode
var mergeMessage

const annouceBadge = document.getElementById('announceBadge').innerHTML

document.body.innerHTML += `<div class="chat" id="chat" style="overflow: hidden; scroll-behavior: smooth;height: 100%; width: 100%; ">
<div id="test" class="fade" style="width: 100%; bottom: 0px; position: absolute;"></div></div>`

/**
 * @brief Retrieves the value of a specified chatbox option.
 *
 * This function fetches the value of a chatbox-related option. It first tries to get
 * the value from the computed styles of the chat element. If not found, it checks
 * the URL search parameters. If the value is not found in either place, an empty 
 * string is returned. All spaces in the final value are removed before returning it.
 *
 * @param[in] optionName The name of the chatbox option to retrieve.
 * @return The value of the specified chatbox option with all spaces removed. 
 * If the option is not found, an empty string is returned.
 */
function getOption(optionName) {
	let url = new URL(document.URL)
	let chatElement = document.getElementById('chat')
	let optionValue = getComputedStyle(chatElement).getPropertyValue(
		'--chatbox-' + optionName
	)
	if (optionValue == '') optionValue = url.searchParams.get(optionName)
	if (!optionValue) optionValue = ''
	return optionValue.replaceAll(' ', '')
}

setTimeout(start, 500)

function toInt(str, _default, err_str) {
	let v = parseInt(str, 10)
	if (Number.isInteger(v))
		return v
	else if (str !== '')
		console.log(err_str)
	return _default
}
async function start() {
	messagesHideDelay = toInt(getOption('messagesHideDelay'), 10, "messagesHideDelay should be an unsigned integer") * 1000
	testMode = toInt(getOption('testMode'), 0, "testMode maybe 0, 1 or 2")

	initTwitch(getOption('token')).then((success) => {
		if (success) {
			Promise.all([
				getChannelBadges(),
				getGlobalBadges(),
				initBTTV(),
				initFF(),
				init7TV(),
			]).then(() => {
				twitchCallback.clearchat = (channel) => {
					// console.log("chat clear");
					let ul = document.getElementById('test')
					ul.innerHTML = '<div style="height: 200vw;"></div>'
				}
				twitchCallback.messagedeleted = (
					channel,
					_username2,
					deletedMessage,
					userstate
				) => {
					delMsg(userstate['target-msg-id'])
				}
				twitchCallback.announcement = (channel, tags, message, self, color) => {
					showMsg({
						channel: channel,
						userstate: tags,
						message: message,
						self: self,
						color: color,
					})
				}
				twitchCallback.message = (channel, userstate, message, self) => {
					// filter unwanted messages
					if (userstate['message-type'] === 'whisper') return

					if (message.charAt(0) === '!') return

					showMsg({
						channel: channel,
						userstate: userstate,
						message: message,
						self: self,
					})
				}
				start_chat(twitchUserInfo.login, twitchUserInfo.client_id)

				if (testMode == 1) testmsg()
				if (testMode == 2) testannounce()

				init7TV()
			})
		}
	})
}

function escapeTag(txt) {
	let buf = document.createElement('textarea')
	buf.innerText = txt
	return buf.innerHTML
}

function subStringReplace(string, replaceString, start, end) {
	let newString = string.substring(0, start)
	newString += replaceString
	newString += string.substring(end, string.length)
	return newString
}

var user_color = new Map()

/**
 * @brief Chooses a unique color for a user based on their user ID.
 *
 * This function assigns a unique color to a user if one hasn't been assigned already.
 * It generates a random RGB color with certain constraints to ensure it's not too
 * grey or too dark. The color is then stored and reused for the given user ID.
 *
 * @param[in] userId The unique identifier of the user.
 * @return The RGB color string assigned to the user.
 */
function choose_user_color(userId) {
	let color = user_color.get(userId)
	if (color === undefined) {
		const threshold = 25
		const offset = 50
		let r = Math.round(Math.random() * 200 + 25)
		let g = Math.round(Math.random() * 200 + 25)
		let b = Math.round(Math.random() * 200 + 25)
		// check for grey color
		if (Math.abs(g - r) < threshold) (g + offset) % 256
		if (Math.abs(b - g) < threshold) (b + offset) % 256

		// check for color intensity
		let a = r + g + b
		if (a < 170) {
			a = 170 / a
			r *= a
			g *= a
			b *= a
		}

		color = 'rgb(' + r + ',' + g + ',' + b + ')'
		user_color.set(userId, color)
	}

	return color
}

/**
 * @brief Adds a message element to the chat and handles its display and removal.
 *
 * This function creates a new chat message element, appends it to the chat container,
 * and handles its display, scrolling behavior, and timed removal based on the 
 * visibility state of the document. If the `messagesHideDelay` is set, the message 
 * will be removed after the specified delay.
 *
 * @param[in] id The unique identifier for the message element.
 * @param[in] txt The HTML content of the message to be displayed.
 */
function add(id, txt) {
	var ul = document.getElementById('test')
	var chatDiv = document.getElementById('chat')

	let li = document.createElement('div')
	li.id = id
	li.className = 'fade div hidden'

	li.innerHTML = txt
	ul.appendChild(li)
	if (document.visibilityState === 'visible') {
		setTimeout(function () {
			chatDiv.style.scrollBehavior = 'smooth'
			li.className = 'fade div show'
		}, 500)
		setTimeout(() => {
			li.scrollIntoView({ behavior: 'smooth' })
		}, 10)
	} else {
		chatDiv.style.scrollBehavior = 'auto'
		chatDiv.scrollTop = chatDiv.scrollHeight
		chatDiv.style.scrollBehavior = 'smooth'
		li.className = 'fade div show_noannim'
	}

	if (messagesHideDelay) {
		setTimeout(async () => {
			if (document.visibilityState === 'visible') {
				li.className = 'fade div hide'
				setTimeout(async () => {
					li.remove()
				}, 2000)
			} else {
				li.className = 'fade div hide_noannim'
				li.remove()
			}
			//                fade(li);
		}, messagesHideDelay)
	}

	// hide the message if it's top goes off view
	li.timerInterval = setInterval(() => {
		let boundingLi = li.getBoundingClientRect()
		let boundingUl = ul.getBoundingClientRect()

		if (boundingLi.top < 0) {
			li.className = 'fade div hide'
			clearInterval(li.timerInterval)
			setTimeout(() => {
				li.remove()
			}, 11000)
		}
	}, 1000)
}

function fade(li) {
	if (li.clientHeight > 0)
		requestAnimationFrame(() => {
			li.clientHeight -= 1 / 60
			li.offsetHeight -= 1 / 60
			fade(li)
		})
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
		// // console.log(message)

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
	//<tr><td style='white-space: nowrap; vertical-align:top;'>";
	// console.log("visibilityState: " + document.visibilityState);

	// badges
	let htmlBadges = ''
	if (twitchMsg.userstate.badges != null) {
		if (Object.keys(twitchMsg.userstate.badges).length > 0)
			htmlBadges += "<span class=''>"

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

			htmlBadges += `<img class='chatBadge' src='${badgeImg}'>`
		})

		if (Object.keys(twitchMsg.userstate.badges).length > 0)
			htmlBadges += `</span>`
	}

	let url = await fetchClipUrl(twitchMsg.message)
	if (url != null) {
		twitchMsg.message = `<video width="100%" src="${url}" loop autoplay muted></video>`
	} else {
		// twitch emotes processing
		if (twitchMsg.userstate.emotes != null) {
			let map = new Array()
			let map2 = new Array()
			Object.entries(twitchMsg.userstate.emotes).forEach(([key, value]) => {
				let emoteIMG = getEmoteImg(key)

				value.forEach((e) => {
					let s = e.split('-')
					map.push({
						start: parseInt(s[0], 10),
						end: parseInt(s[1], 10),
						emoteIMG: getEmoteImg(key),
					})
				})
			})

			map.sort((firstEl, secondEl) => {
				return secondEl.start - firstEl.start
			})

			let end0 = twitchMsg.message.length - 1

			map.forEach((e) => {
				if (end0 !== e.end) {
					map2.unshift({
						start: e.end + 1,
						end: end0,
						emoteIMG: escapeTag(
							twitchMsg.message.substring(e.end + 1, end0 + 1)
						),
					})
				}
				end0 = e.start - 1
			})

			if (end0 >= 0) {
				map2.unshift({
					start: 0,
					end: end0,
					emoteIMG: escapeTag(twitchMsg.message.substring(0, end0 + 1)),
				})
			}

			map = map.concat(map2)

			map.sort((firstEl, secondEl) => {
				return firstEl.start - secondEl.start
			})

			twitchMsg.message = ''
			map.forEach((e) => {
				twitchMsg.message += e.emoteIMG
			})
		} else {
			twitchMsg.message = escapeTag(twitchMsg.message)
		}

		// bttv emotes processing
		let regex = /([^.;, \n]+)/gm
		function f(correspondance, p1, decalage, chaine) {
			// console.log("---------------");
			// console.log(correspondance);
			// console.log(p1);
			// console.log(decalage);
			// // console.log(chaine);
			// console.log("---------------");

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
	let messagebox = document.getElementById('messagebox-template').innerHTML

	if (messagebox != null) {
		messagebox = messagebox.replaceAll(
			'${nameColor}',
			twitchMsg.userstate.color
				? twitchMsg.userstate.color
				: choose_user_color(twitchMsg.userstate['user-id'])
		)
		if (twitchMsg.userstate['user-id'] == '741565995')
			messagebox = messagebox.replaceAll(
				'${name}',
				`	<span class="block-line"><span><span style="color:#ff0000;">l</span><span style="color:#ffaa00;">e</span><span style="color:#aaff00;">s</span><span style="color:#00ff00;">m</span><span style="color:#00ffaa;">a</span><span style="color:#00aaff;">l</span><span style="color:#0000ff;">o</span><span style="color:#aa00ff;">u</span><span style="color:#ff00aa;">s</span></span></span>`
			)
		else
			messagebox = messagebox.replaceAll(
				'${name}',
				twitchMsg.userstate['display-name']
			)
		messagebox = messagebox.replaceAll(
			'${announce}',
			twitchMsg.userstate['message-type'] == 'announcement' ? annouceBadge : ''
		)
		messagebox = messagebox.replaceAll('${htmlBadges}', htmlBadges)
		messagebox = messagebox.replaceAll('${msg}', twitchMsg.message)

		add(twitchMsg.userstate.id, messagebox + '<br>')
	}
}

function delMsg(id) {
	let message = document.getElementById(id)
	if (message != null) {
		if (message.parentNode) {
			message.parentNode.removeChild(message)
		}
	}
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
