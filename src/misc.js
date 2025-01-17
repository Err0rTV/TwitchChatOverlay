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
 * @brief Chooses a unique color for a user based on their user ID.
 *
 * This function assigns a unique color to a user if one hasn't been assigned already.
 * It generates a random RGB color with certain constraints to ensure it's not too
 * grey or too dark. The color is then stored and reused for the given user ID.
 *
 * @param[in] userId The unique identifier of the user.
 * @return The RGB color string assigned to the user.
 */
export function choose_user_color(userId) {
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
