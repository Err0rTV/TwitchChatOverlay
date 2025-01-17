module.exports = {
	launch: {
		dumpio: true,
		headless: true,
		product: 'chrome',
		args: [
			"--disable-web-security"
		],
	},
	browserContext: 'default',
}