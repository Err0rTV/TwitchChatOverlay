cpuppeteer = require('./cpuppeteer.js')

// let exp = ['please provide a valid token']
describe.each([
	[
		[
			'--chatbox-testMode: 1;',
			'--chatbox-messagesHideDelay: aaa;',
		],
		process.env.TWITCH_TOKEN,
		['messagesHideDelay should be an unsigned integer'],
	],
	[
		[
			'--chatbox-testMode: 2;',
			'--chatbox-messagesHideDelay: a;',
		],
		process.env.TWITCH_TOKEN,
		['messagesHideDelay should be an unsigned integer'],
	],
])('', (param, token, expected) => {
	var puppet
	beforeAll(async () => {
		puppet = new cpuppeteer()
		await puppet.init(['--no-sandbox'])
		await puppet.goto('../dist/OBSTwitchChat.html')
		await puppet.page.evaluate((token) => {
			localStorage.setItem('access_token', `${token}`);
		}, token);
		await puppet.page.addStyleTag({
			content: `
				.chat {
				  ${param.join(' ')}
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
