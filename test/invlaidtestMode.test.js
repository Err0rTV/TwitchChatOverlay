cpuppeteer = require('./cpuppeteer.js')

// let exp = ['please provide a valid token']
describe.each([
	[
		'--chatbox-testMode: a;',
		`--chatbox-token: ${process.env.TWITCH_TOKEN};`,
		["testMode maybe 0, 1 or 2"],
	],
	[
		'--chatbox-testMode: aaa;',
		`--chatbox-token: ${process.env.TWITCH_TOKEN};`,
		["testMode maybe 0, 1 or 2"],
	],
])('', (testMode, token, expected) => {
	var puppet
	beforeAll(async () => {
		puppet = new cpuppeteer()
		await puppet.init()
		await puppet.goto('../dist/OBSTwitchChat.html')
		await puppet.page.addStyleTag({
			content: `
				.chat {
				  ${testMode} ${token}
			  }`,
		})
		await new Promise((r) => setTimeout(r, 5000))
	}, 90 * 1000)

	test(`le message dans la console doit être "${expected}"`, async () => {
		await expect(puppet.output).toEqual(expected)
	})

	test('no errors', async () => {
		await expect(puppet.errors).toHaveLength(0)
	})

	afterAll(async () => {
		await puppet.close()
	})
})
