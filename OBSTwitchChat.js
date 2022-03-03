function getEmoteImg(emoteId) {
	return "<img class=\"chatEmote\" src=\"https://static-cdn.jtvnw.net/emoticons/v2/" + emoteId + "/default/dark/3.0\">"
}

function subStringReplace(string, replaceString, start, end) {
	let newString = string.substring(0, start);
	newString += replaceString;
	newString += string.substring(end, string.length)
	return newString;
}






let url_string = document.URL
console.log(document.URL);

var url = new URL(url_string);
var c = url.searchParams.get("test");
var userid = parseInt(url.searchParams.get("userid"));
var hideMessages = parseInt(url.searchParams.get("hideMessages"));
if (hideMessages === NaN) hideMessages = 0;

console.log(c);

// window.localStorage.setItem("twitchChatTocken", "")

let tocken;
if (url.searchParams.has("twitchChatTocken"))
	tocken = url.searchParams.get("twitchChatTocken")
else
	tocken = localStorage.getItem("twitchChatTocken")



var glogal_badge_sets = new Object();
var channel_badge_sets = new Object();

fetch("https://badges.twitch.tv/v1/badges/channels/237719570/display")
	.then(response => response.json())
	.then(data => {
		channel_badge_sets = data.badge_sets;
		console.log(data.badge_sets);
	})


fetch("https://badges.twitch.tv/v1/badges/global/display")
	.then(response => response.json())
	.then(data => {
		glogal_badge_sets = data.badge_sets;
		console.log(glogal_badge_sets);
	})





const client = new tmi.Client({
	options: { debug: true, messagesLogLevel: "info" },
	connection: {
		reconnect: true,
		secure: true
	},
	identity: {
		username: 'syntax_err0r',
		password: tocken
	},
	channels: ['syntax_err0r']

});
client.connect().catch(console.error);

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

async function testmsg() {
	const dumyText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue. Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede. Praesent blandit odio eu enim. Pellentesque sed dui ut augue blandit sodales. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam nibh. Mauris ac mauris sed pede pellentesque fermentum. Maecenas adipiscing ante non diam sodales hendrerit.";


	let dumybadges = [
		"https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/2",
		"https://static-cdn.jtvnw.net/badges/v1/92b7d84f-64b5-4150-9761-6e599ccd6d4c/2"
	];

	let name = new Object();
	name.userId = dumyText.replace(" ", "").substring(0, 4 + Math.random() * 21);
	name.color = "";


	let color = choose_user_color(name);

	showMsg("", dumybadges, name.userId, color, dumyText.substring(0, Math.random() * 50));
	var t = setTimeout(() => { testmsg(); }, 100 + Math.random() * 15000);
}
// testmsg();



async function showMsg(id, badges, name, nameColor, msg) {
	let txt = "";
	//<tr><td style='white-space: nowrap; vertical-align:top;'>";
	console.log("visibilityState: " + document.visibilityState);

	txt += "<div style='background: rgba(77, 77, 77, 0.4);' class='chatMsgContener'>";

	txt += "<div class='charMsgText' style='color:";

	// color
	txt += nameColor;

	txt += ";'>";
	txt += "<strong>";

	// displayName
	txt += name;

	txt += "</strong>";
	txt += "</div>";
	if (badges != null)
		if (Object.keys(badges).length > 0)
			txt += "<div class='charMsgText'>";
	// badges

	if (badges != null)
		Object.entries(badges).forEach(([key, value]) => {

			txt += "<img class='chatBadge' src='";
			console.log(channel_badge_sets[key]);

			if (channel_badge_sets[key] != null) {
				if (channel_badge_sets[key].versions[value] != undefined)
					txt += channel_badge_sets[key].versions[value].image_url_4x;
				else
					txt += glogal_badge_sets[key].versions[value].image_url_4x;
			}
			else
				txt += glogal_badge_sets[key].versions[value].image_url_4x;

			txt += "''>";
			//console.log(txt);
		});

	if (badges != null)
		if (Object.keys(badges).length > 0)
			txt += "</div>";
	txt += "<div class='charMsgText'>";

	// message
	txt += msg;

	txt += "</div>";
	txt += "</div>";


	add(id, txt + "<br>");
}



