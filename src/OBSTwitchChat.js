var token;
var messagesHideDelay;
var testMode;
var mergeMessage;
var develop;

const annouceBadge = document.getElementById("announceBadge").innerHTML;

document.body.innerHTML += `<div class="chat" id="chat" style="overflow: hidden; scroll-behavior: smooth;height: 100%; width: 100%; ">
<div id="test" class="fade" style="height: 100%; width: 100%;">
	<div style="height: 200vw;"></div>
</div>
</div>`;

function getOption(optionName)
{
	let url = new URL(document.URL);
	let chatElement = document.getElementById("chat");
	let optionValue = getComputedStyle(chatElement).getPropertyValue("--chatbox-" + optionName)
	if (optionValue == "")
		optionValue = url.searchParams.get(optionName);
	if(!optionValue)
		optionValue = "";
	return optionValue.replaceAll(" ", "");
}

setTimeout( start, 500);

var glogal_badge_sets = new Object();
var channel_badge_sets = new Object();

var bttv_emotes = new Map();

async function start() {

	messagesHideDelay = parseInt(getOption("messagesHideDelay"), 10) * 1000;
	testMode = parseInt(getOption("testMode"), 10);
	token = getOption("token");

	if (token) {
		if(token.startsWith("oauth:")) {
			if(develop === 1)
				localStorage.setItem("twitchChatToken", token)
		}
		else
		{
			console.error("token should start with \"oauth:\"");
			token = "";
		}
	}
	else
		token = localStorage.getItem("twitchChatToken")

	getFFGlobalEmotes();
	getBTTVGlobalEmotes();

	glogal_badge_sets = await getGlobalBadges();
	if (token != "" && token != null) {
		const { user_id, login, client_id, status } = await getUserInfos(token);
		if (status != 200) {
			console.error("invalid token, please provide a valid token");
		}
		else {
			channel_badge_sets = await getChannelBadges(user_id);
			getBTTVChannelEmotes(user_id);
			getFFChannelEmotes(user_id);
			start_chat(login, client_id);
		}
	}
	else
		console.log("please provide a valid token");

	if (testMode == 1) testmsg();
	if (testMode == 2) testannounce();
}

function escapeTag(txt) {
	let buf = document.createElement("textarea");
	buf.innerText = txt;
	return buf.innerHTML;
}

function start_chat(login,client_id) {
	var botmap = new Map();
	botlist.bots.forEach((e)=>{
		botmap.set(e[0], true);

	});
	if (typeof customBot != 'undefined')
		customBot.forEach((e) => {
			botmap.set(e, true);
		});

	if (typeof whiteListBot != 'undefined')
		whiteListBot.forEach((e) => {
			botmap.delete(e);
		});

	if (token != "") {
		const client = new tmi.Client({
			options: { debug: true, 
				messagesLogLevel: "info",
				clientId: client_id
			},
			connection: {
				reconnect: true,
				secure: true
			},
			identity: {
				username: login,
				password: token
			},
			channels: [login]

		});
		client.connect().catch(console.error);


		client.on('emotesets', (sets, obj) => {
		});

		client.on('clearchat', (channel) => {
			console.log("chat clear");
			let ul = document.getElementById('test');
			ul.innerHTML = '<div style="height: 200vw;"></div>';
		});

		client.on('messagedeleted', (channel, _username2, deletedMessage, userstate) => {
			delMsg(userstate["target-msg-id"]);
		});

		client.on('announcement', (channel, tags, message, self, color) => {

			// filter bots
			if (botmap.get(tags["login"]))
				return;

			showMsg({ channel: channel, userstate: tags, message: message, self: self, color: color });
		});

		client.on('message', (channel, userstate, message, self) => {

			// filter unwanted messages
			if(userstate["message-type"] === "whisper")
				return;

			if(message.charAt(0) === "!")
				return;

			// filter bots
			if(botmap.get(userstate["username"]))
				return;

			showMsg({channel: channel, userstate: userstate, message: message, self: self});
		});
	}
}

function getUserInfos(token) {
	let status;
	return fetch(`https://id.twitch.tv/oauth2/validate`, {
		headers: new Headers({
			'Authorization': 'Bearer ' + token.split(':')[1],
		}),
	})
		.then(response => {
			status = response.status;
			return response.json();
		})
		.then(data => {
			data.status = status;
			return data;
		})
		.catch((error)=>{
			console.error(error);
		})
}

function getChannelBadges(user_id) {
	return fetch(`https://badges.twitch.tv/v1/badges/channels/${user_id}/display`)
		.then(response => response.json())
		.then(data => {
			return data.badge_sets;
		})
}

function getGlobalBadges() {
	return fetch("https://badges.twitch.tv/v1/badges/global/display")
		.then(response => response.json())
		.then(data => {
			return data.badge_sets;
		})
}

function getFFGlobalEmotes() {
	return fetch("https://api.betterttv.net/3/cached/frankerfacez/emotes/global")
		.then(response => response.json())
		.then(data => {

			data.forEach(e => {
				let img;
				if(e.images["4x"] != null) img = e.images["4x"];
				else if(e.images["2x"] != null) img = e.images["2x"];
				else if(e.images["1x"] != null) img = e.images["1x"];
				
				bttv_emotes.set(e.code, img);
			});
		})
}

function getBTTVGlobalEmotes() {
	return fetch("https://api.betterttv.net/3/cached/emotes/global")
		.then(response => response.json())
		.then(data => {

			data.forEach(e => {
				bttv_emotes.set(e.code, `https://cdn.betterttv.net/emote/${e.id}/3x`);
			});
		})
}

function getBTTVChannelEmotes(user_id) {
	return fetch(`https://api.betterttv.net/3/cached/users/twitch/${user_id}`)
		.then(response => {
			console.log(response.status);
			if(response.status == 200)
				return response.json()
			else
				return {channelEmotes: Array(), sharedEmotes: Array()};
		})
		.then(data => {
			console.log(data);
			data.channelEmotes.forEach(e => {
				bttv_emotes.set(e.code, `https://cdn.betterttv.net/emote/${e.id}/3x`);
			});
			data.sharedEmotes.forEach(e => {
				bttv_emotes.set(e.code, `https://cdn.betterttv.net/emote/${e.id}/3x`);
			});
		})
}

function getFFChannelEmotes(user_id) {
	
	return fetch(`https://api.betterttv.net/3/cached/frankerfacez/users/twitch/${user_id}`)
		.then(response => response.json())
		.then(data => {
			data.forEach(e => {
				let img;
				if(e.images["4x"] != null) img = e.images["4x"];
				else if(e.images["2x"] != null) img = e.images["2x"];
				else if(e.images["1x"] != null) img = e.images["1x"];

				bttv_emotes.set(e.code, `${img}`);
			});
		})}

function getEmoteImg(emoteId) {
	return `<img class="chatEmote" src="https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/3.0">`;
}

function subStringReplace(string, replaceString, start, end) {
	let newString = string.substring(0, start);
	newString += replaceString;
	newString += string.substring(end, string.length)
	return newString;
}

var user_color = new Map();

function choose_user_color(userId) {
	let color = user_color.get(userId);
	if (color === undefined) {
		const threshold = 25;
		const offset = 50;
		r = Math.round((Math.random() * 200) + 25);
		g = Math.round((Math.random() * 200) + 25);
		b = Math.round((Math.random() * 200) + 25);
		// check for grey color
		if (Math.abs(g - r) < threshold) (g + offset) % 256;
		if (Math.abs(b - g) < threshold) (b + offset) % 256;

		// check for color intensity
		a = r + g + b;
		if (a < 170) {
			a = 170 / a;
			r *= a;
			g *= a;
			b *= a;
		}

		color = "rgb(" + r + "," + g + "," + b + ")";
		user_color.set(userId, color);
	}

	return color;
}


function add(id, txt) {
	var ul = document.getElementById('test');
	var chatDiv = document.getElementById('chat');

	let li = document.createElement("div");
	li.id = id;
	li.className = "fade div hidden";

	li.innerHTML = txt;
	ul.appendChild(li);
	if (document.visibilityState === "visible") {
		setTimeout(function () {
			chatDiv.style.scrollBehavior = "smooth";
			li.className = "fade div show";
		}, 500);
		setTimeout(() => { li.scrollIntoView({ behavior: "smooth" }) }, 10);
	}
	else {
		chatDiv.style.scrollBehavior = "auto";
		chatDiv.scrollTop = chatDiv.scrollHeight;
		chatDiv.style.scrollBehavior = "smooth";
		li.className = "fade div show_noannim";
	}

	if (messagesHideDelay) {
		setTimeout(async () => {
			if (document.visibilityState === "visible") {
				li.className = "fade div hide";
				setTimeout(async () => {
					// li.remove();
				}, 2000);
			}
			else {
				li.className = "fade div hide_noannim";
				// li.remove();
			}
			//                fade(li);
		}, messagesHideDelay);
	}

	// hide the message if it's top goes off view
	li.timerInterval = setInterval(() => {
		let boundingLi = li.getBoundingClientRect();
		let boundingUl = ul.getBoundingClientRect();

		if (boundingLi.top < 0) {
			li.className = "fade div hide";
			clearInterval(li.timerInterval);
			setTimeout(() => {
				li.remove();
			}, 11000);
		}
	}, 1000);
}

function fade(li) {
	if (li.clientHeight > 0)
		requestAnimationFrame(() => {
			li.clientHeight -= 1 / 60;
			li.offsetHeight -= 1 / 60;
			fade(li);
		})
}

async function fetchClipUrl(message) {
	const regex = [
		/^https:\/\/www.twitch.tv\/.+\/clip\/(.+)$/gm,
		/^https:\/\/clips.twitch.tv\/(.+)$/gm
	]

	message = message.replace('http://', 'https://')
	message = message.replace(/\?.*/, '')

	let slug = ''

	regex.forEach(element => {
		m = element.exec(message)
		if (m != null) {
			slug = m[1]
		}
	});

	if (slug != '') {
		let url
		console.log(message)

		for (let c = 1; c <= 3; c++) {
			let response = await fetch(`https://clips.twitch.tv/${slug}`).catch((error) => { });

			if (response == undefined) {
				console.log("can't fetch clip, launch obs with --disable-web-security parameter");
				return null;
			}

			let data = await response.text();

			let m = data.match(/.*(<meta.*?property="og:image".*?\/>)/m)

			if (m != null) {
				m = m[1].match(/content="(.*)"/)
				url = m[1].replace("-social-preview.jpg", ".mp4") //BUG: regex not match
				console.log(url)
				return url
			}
			console.log("retry " + c)
			await new Promise((r) => setTimeout(r, 2000));
		}
	}
	return null
}

async function showMsg(twitchMsg) {
	//<tr><td style='white-space: nowrap; vertical-align:top;'>";
	// console.log("visibilityState: " + document.visibilityState);

	// badges
	let htmlBadges = "";
	if (twitchMsg.userstate.badges != null) {
		if (Object.keys(twitchMsg.userstate.badges).length > 0)
			htmlBadges += "<span class=''>";

		Object.entries(twitchMsg.userstate.badges).forEach(([key, value]) => {
			let badge;
			if (channel_badge_sets[key] != null) {
				if (channel_badge_sets[key].versions[value] != undefined)
					badge = channel_badge_sets[key].versions[value].image_url_4x;
				else
					badge = glogal_badge_sets[key].versions[value].image_url_4x;
			}
			else
				badge = glogal_badge_sets[key]?.versions[value].image_url_4x;

			htmlBadges += `<img class='chatBadge' src='${badge}'>`;
		});

		if (Object.keys(twitchMsg.userstate.badges).length > 0)
			htmlBadges += `</span>`;
	}

	let url = await fetchClipUrl(twitchMsg.message)
	if (url != null) {
		twitchMsg.message = `<video width="100%" src="${url}" loop autoplay muted></video>`;
	}
	else {
		// twitch emotes processing
		if (twitchMsg.userstate.emotes != null) {
			let map = new Array();
			let map2 = new Array();
			Object.entries(twitchMsg.userstate.emotes).forEach(([key, value]) => {
				let emoteIMG = getEmoteImg(key);


				value.forEach(e => {
					let s = e.split('-');
					map.push({ start: parseInt(s[0], 10), end: parseInt(s[1], 10), emoteIMG: getEmoteImg(key) });
				});
			});

			map.sort((firstEl, secondEl) => {
				return secondEl.start - firstEl.start;
			});

			let end0 = twitchMsg.message.length - 1;

			map.forEach((e) => {
				if (end0 !== e.end) {
					map2.unshift({ start: e.end + 1, end: end0, emoteIMG: escapeTag(twitchMsg.message.substring(e.end + 1, end0 + 1)) });
				}
				end0 = e.start - 1;
			});

			if (end0 >= 0) {
				map2.unshift({ start: 0, end: end0, emoteIMG: escapeTag(twitchMsg.message.substring(0, end0 + 1)) });
			}

			map = map.concat(map2);

			map.sort((firstEl, secondEl) => {
				return firstEl.start - secondEl.start;
			});

			twitchMsg.message = "";
			map.forEach((e) => {
				twitchMsg.message += e.emoteIMG;
			})
		}
		else {
			twitchMsg.message = escapeTag(twitchMsg.message);
		}

		// bttv emotes processing
		let regex = /([^.;, \n]+)/gm;
		function f(correspondance, p1, decalage, chaine) {
			// console.log("---------------");
			// console.log(correspondance);
			// console.log(p1);
			// console.log(decalage);
			// // console.log(chaine);
			// console.log("---------------");

			let img = bttv_emotes.get(correspondance);


			if (img) {
				img = `<img class="chatEmote" src="${img}">`;
				return img;
			}
			else
				return correspondance;
		}

		twitchMsg.message = twitchMsg.message.replace(regex, f);
	}

	if (twitchMsg.userstate["message-type"] == "action")
	twitchMsg.message = `<i>${twitchMsg.message}</i>`;


	// HTML element creation
	let messagebox = document.getElementById("messagebox-template").innerHTML;

	if (messagebox != null) {
		messagebox = messagebox.replaceAll("${nameColor}", twitchMsg.userstate.color ? twitchMsg.userstate.color : choose_user_color(twitchMsg.userstate["user-id"]));
		if (twitchMsg.userstate["user-id"] == "741565995")
			messagebox = messagebox.replaceAll("${name}", `	<span class="block-line"><span><span style="color:#ff0000;">l</span><span style="color:#ffaa00;">e</span><span style="color:#aaff00;">s</span><span style="color:#00ff00;">m</span><span style="color:#00ffaa;">a</span><span style="color:#00aaff;">l</span><span style="color:#0000ff;">o</span><span style="color:#aa00ff;">u</span><span style="color:#ff00aa;">s</span></span></span>`);
		else
			messagebox = messagebox.replaceAll("${name}", twitchMsg.userstate["display-name"]);
			messagebox = messagebox.replaceAll("${announce}", twitchMsg.userstate["message-type"]=="announcement" ? annouceBadge : "");
			messagebox = messagebox.replaceAll("${htmlBadges}", htmlBadges);
			messagebox = messagebox.replaceAll("${msg}", twitchMsg.message);

		add(twitchMsg.userstate.id, messagebox + "<br>");
	}
}

function delMsg(id) {
	let message = document.getElementById(id);
	if (message != null) {
		if (message.parentNode) {
			message.parentNode.removeChild(message);
		}
	}
}

async function testmsg() {
	const dumyText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue. Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede. Praesent blandit odio eu enim. Pellentesque sed dui ut augue blandit sodales. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam nibh. Mauris ac mauris sed pede pellentesque fermentum. Maecenas adipiscing ante non diam sodales hendrerit.";

	let testMsg = {
		channel: "#syntax_err0r",
		userstate: {
		"badge-info": null,
		"badges": {
			"broadcaster": "1",
			"subscriber": "12"
			},
		"color": null,
		"display-name": dumyText.replace(" ", "").substring(0, 4 + Math.random() * 21),
		"emotes": null,
		"first-msg": false,
		"flags": null,
		"id": "6b526ea6-29bc-42b0-a235-0cc4aec6c36b",
		"mod": false,
		"returning-chatter": false,
		"room-id": "237719570",
		"subscriber": false,
		"tmi-sent-ts": "1657319410322",
		"turbo": false,
		"user-id": Math.round(Math.random() * 1000),
		"user-type": null,
		"emotes-raw": "41:79-86",
		"badge-info-raw": null,
		"badges-raw": "vip/1",
		"username": dumyText.replace(" ", "").substring(0, 4 + Math.random() * 21),
		"message-type": "chat"
	},
	message: dumyText.substring(0, 1 + Math.random() * 50),
	self: false
	};

	showMsg(testMsg);

	var t = setTimeout(() => { testmsg(); }, 100 + Math.random() * 15000);
}

async function testannounce() {

	const dumyText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue. Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede. Praesent blandit odio eu enim. Pellentesque sed dui ut augue blandit sodales. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam nibh. Mauris ac mauris sed pede pellentesque fermentum. Maecenas adipiscing ante non diam sodales hendrerit.";

	let testMsg = {
		channel: "#syntax_err0r",
		userstate: {
			"badge-info": null,
			"badges": {
				"broadcaster": "1",
				"subscriber": "12"
				},
			"color": null,
			"display-name": dumyText.replace(" ", "").substring(0, 4 + Math.random() * 21),
			"emotes": null,
			"flags": null,
			"id": "2588d8e5-bb11-43b3-adf3-e2213f149ce2",
			"login": dumyText.replace(" ", "").substring(0, 4 + Math.random() * 21),
			"mod": false,
			"msg-id": "announcement",
			"msg-param-color": "PRIMARY",
			"room-id": "237719570",
			"subscriber": true,
			"system-msg": null,
			"tmi-sent-ts": "1657319131524",
			"user-id": Math.round(Math.random() * 1000),
			"user-type": null,
			"emotes-raw": null,
			"badge-info-raw": "subscriber/27",
			"badges-raw": "broadcaster/1,subscriber/12",
			"message-type": "announcement"
		},
	message: dumyText.substring(0, 1 + Math.random() * 50),
	self: false,
	color: "PRIMARY"
	};

	showMsg(testMsg);

	var t = setTimeout(() => { testannounce(); }, 100 + Math.random() * 15000);
}