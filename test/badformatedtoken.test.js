cpuppeteer = require('./cpuppeteer.js')

// let exp = ['please provide a valid token']
describe.each([
	[
		'--chatbox-testMode: 1;',
		'--chatbox-token: sdfsdf;',
		['token should start with "oauth:"', 'please provide a valid token'],
	],
	[
		'--chatbox-testMode: 2;',
		'--chatbox-token: sdfsdf;',
		['token should start with "oauth:"', 'please provide a valid token'],
	],
])('%s, %s', (testMode, token, expected) => {
	var puppet
	beforeAll(async () => {
		puppet = new cpuppeteer()
		await puppet.init()
		await puppet.goto('../src/OBSTwitchChat.html')
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
