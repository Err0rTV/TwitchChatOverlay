
var url = new URL(document.URL);
var hideMessages = parseInt(url.searchParams.get("hideMessages"));
var testMode = parseInt(url.searchParams.get("testMode"));
if (hideMessages === NaN) hideMessages = 0;
var token;


var glogal_badge_sets = new Object();
var channel_badge_sets = new Object();

async function start() {
	if (url.searchParams.has("twitchChatToken")) {
		token = url.searchParams.get("twitchChatToken")
		localStorage.setItem("twitchChatToken", token)
	}
	else
		token = localStorage.getItem("twitchChatToken")

	const {user_id, login} = await getUserInfos();
	console.log(user_id);
	channel_badge_sets = await getChannelBadges(user_id);
	glogal_badge_sets = await getGlobalBadges();
	console.log(glogal_badge_sets);
	console.log(channel_badge_sets);
	start_chat(login);
}

function start_chat(login) {
	if (token != "") {
		const client = new tmi.Client({
			options: { debug: true, messagesLogLevel: "info" },
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


		client.on('messagedeleted', (channel, _username2, deletedMessage, tags) => {
			console.log(channel);
			console.log(_username2);
			console.log(deletedMessage);
			console.log(tags);
			delMsg(tags["target-msg-id"]);
		});
/*		{
		client.on('message', (channel, tags, message, self) => {
			if (tags.emotes != null) {
				let map = new Array();
				Object.entries(tags.emotes).forEach(([key, value]) => {
					console.log(key + " " + value);
					let emoteIMG = getEmoteImg(key);


					value.forEach(e => {
						let s = e.split('-');
						map.push({ start: parseInt(s[0]), end: parseInt(s[1]), emoteIMG: getEmoteImg(key) });
					});
				});

				map.sort((firstEl, secondEl) => {
					return secondEl.start - firstEl.start;
				});
				map.forEach(e => {
					message = subStringReplace(message, e.emoteIMG, e.start, (e.end + 1));
					console.log(e.start + " " + (e.end + 1) + " " + message);
				});
			}

			console.log(message);
			console.log(tags);
			showMsg(tags.id, tags.badges, tags["display-name"], tags.color ? tags.color : choose_user_color(tags["user-id"]), message)
		});
	}
}

function getUserInfos() {
	return fetch(`https://id.twitch.tv/oauth2/validate`, {
		headers: new Headers({
			'Authorization': 'Bearer ' + token.split(':')[1],
		}),
	})
		.then(response => response.json())
		.then(data => {
			return data;
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

function choose_user_color(user) {
	console.log("user: " + user);
	if (user.color === '') {
		let color = user_color.get(user.userId);
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
				// a = 51 - (a / 3); // case 0: 150 care 150: 1    50-a 
				r *= a;
				g *= a;
				b *= a;
			}

			console.log(r + ":" + g + ":" + b);
			color = "rgb(" + r + "," + g + "," + b + ")";
			user_color.set(user.userId, color);
			// console.log(color);
		}
		else {
			return color;
		}

		return color;
	}
	else {
		return user.color;
	}
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
		console.log("anim");
		setTimeout(function () {
			chatDiv.style.scrollBehavior = "smooth";
			li.className = "fade div show";
		}, 500);
		setTimeout(() => { li.scrollIntoView({ behavior: "smooth" }) }, 10);
	}
	else {
		console.log("noanim");
		chatDiv.style.scrollBehavior = "auto";
		chatDiv.scrollTop = chatDiv.scrollHeight;
		chatDiv.style.scrollBehavior = "smooth";
		li.className = "fade div show_noannim";
	}

	if (hideMessages === 1) {
		console.log("22");
		setTimeout(async () => {
			console.log("hide message");
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
		}, 15000);
	}

	// hide the message if it's top goes off view
	li.timerInterval = setInterval(() => {
		let boundingLi = li.getBoundingClientRect();
		let boundingUl = ul.getBoundingClientRect();
		// console.log(li.offsetBottom);
		// console.log(ul.scrollHeight);
		// console.log(ul.clientHeight);
		// console.log(ul.getBoundingClientRect());
		// console.log(li.getBoundingClientRect());
		if (boundingLi.top < 0) {
			li.className = "fade div hide";
			clearInterval(li.timerInterval);
			setTimeout(() => {
				li.remove();
			}, 11000);
		}
	}, 1000);

	console.log("add");
}

function fade(li) {
	if (li.clientHeight > 0)
		requestAnimationFrame(() => {
			li.clientHeight -= 1 / 60;
			li.offsetHeight -= 1 / 60;
			fade(li);
		})
}

async function showMsg(id, badges, name, nameColor, msg) {
	let txt = "";
	//<tr><td style='white-space: nowrap; vertical-align:top;'>";
	console.log("visibilityState: " + document.visibilityState);

	// badges
	let htmlBadges = "";
	if (badges != null) {
		if (Object.keys(badges).length > 0)
			htmlBadges += "<div class='charMsgText'>";

		Object.entries(badges).forEach(([key, value]) => {

			console.log(channel_badge_sets[key]);
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

		if (Object.keys(badges).length > 0)
			htmlBadges += `</div>`;
	}
	txt += `<div style='background: rgba(77, 77, 77, 0.4);' class='chatMsgContener'>
						<div class='charMsgText' style='color:${nameColor};'><strong>${name}</strong>
						</div>${htmlBadges}
						<div class='charMsgText'>${msg}</div>
					</div>`;

	add(id, txt + "<br>");
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

	let dumybadges = {
		"broadcaster": "1",
		"subscriber": "12"
	};

	let name = new Object();
	name.userId = dumyText.replace(" ", "").substring(0, 4 + Math.random() * 21);
	name.color = "";

	let color = choose_user_color(name);

	showMsg("", dumybadges, name.userId, color, dumyText.substring(0, Math.random() * 50));
	var t = setTimeout(() => { testmsg(); }, 100 + Math.random() * 15000);
}

if (testMode === 1)
	testmsg();
else
	start();
