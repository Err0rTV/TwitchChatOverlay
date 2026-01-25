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
export function getOption(optionName) {
	let url = new URL(document.URL)
	let chatElement = document.getElementById('chat')
	let optionValue = getComputedStyle(chatElement).getPropertyValue(
		'--chatbox-' + optionName
	)
	if (optionValue == '') optionValue = url.searchParams.get(optionName)
	if (!optionValue) optionValue = ''
	return optionValue.replaceAll(' ', '')
}

export function toInt(str, _default, err_str) {
	let v = parseInt(str, 10)
	if (Number.isInteger(v)) return v
	else if (str !== '') console.log(err_str)
	return _default
}

export function escapeTag(txt) {
	let buf = document.createElement('textarea')
	buf.innerText = txt
	return buf.innerHTML
}

export function subStringReplace(string, replaceString, start, end) {
	let newString = string.substring(0, start)
	newString += replaceString
	newString += string.substring(end, string.length)
	return newString
}

var user_color = new Map()

/**
 * @brief Generates a deterministic color for a user based on their numeric ID.
 *
 * This function derives a hue from the userId using the Golden Angle approximation.
 * This ensures that even dispersed or sequential IDs (like Twitch UIDs) receive 
 * visually distinct colors without clustering.
 * * Saturation and Lightness are fixed (100%, 50%) to guarantee visibility 
 * and prevent grey or dark colors.
 *
 * @param[in] userId The numeric identifier of the user.
 * @return The CSS HSL color string (e.g., "hsl(120, 100%, 50%)").
 */
export function choose_user_color(userId) {
	let color = user_color.get(userId)

	if (color === undefined) {
		// Multiply by the Golden Angle (~137.5 degrees)
		// This distributes large, dispersed IDs evenly across the color wheel
		// preventing "clustering" of colors.		
		const h = Math.floor((userId * 137.508) % 360)

		// Lock Saturation and Lightness for good visibility
		const s = 100
		const l = 50

		color = `hsl(${h}, ${s}%, ${l}%)`
		user_color.set(userId, color)
	}

	return color
}
