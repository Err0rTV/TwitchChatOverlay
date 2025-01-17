import { toInt, getOption } from './misc.js'
import {
	start_chat,
	twitchCallback,
	twitchUserInfo,
	getChannelBadges,
	getGlobalBadges,
	initTwitch,
} from './twitch.js'
import { initBTTV } from './betterttv.js'
import { initFF } from './frankerzface.js'
import { init7TV } from './seventv.js'

var messagesHideDelay
var mergeMessage

document.body.innerHTML += `<div class="chat" id="chat" style="overflow: hidden; scroll-behavior: smooth;height: 100%; width: 100%; ">
<div id="test" class="fade" style="width: 100%; bottom: 0px; position: absolute;"></div></div>`

// setTimeout(start, 500)
document.addEventListener('DOMContentLoaded', (event) => {
	start()
})

async function start() {
	messagesHideDelay =
		toInt(
			getOption('messagesHideDelay'),
			0,
			'messagesHideDelay should be an unsigned integer'
		) * 1000

	initTwitch().then((success) => {
		if (success) {
			Promise.all([
				getChannelBadges(),
				getGlobalBadges(),
				initBTTV(),
				initFF(),
				init7TV(),
			]).then(() => {
				start_chat(twitchUserInfo.login, twitchUserInfo.client_id)
			})
		}
	})
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
export function add(id, html) {
	var ul = document.getElementById('test')
	var chatDiv = document.getElementById('chat')

	let li = document.createElement('div')
	li.id = id
	li.className = 'fade div hidden'

	li.appendChild(html)
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

export function delMsg(id) {
	let message = document.getElementById(id)
	if (message != null) {
		if (message.parentNode) {
			message.parentNode.removeChild(message)
		}
	}
}
