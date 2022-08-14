cpuppeteer = require('./cpuppeteer.js')

describe.each([
	[
		'https://www.twitch.tv/zaktael/clip/AbstemiousBoxyPuppySwiftRage-fgZMHRdb9nbM61b7',
		'https://clips-media-assets2.twitch.tv/7XafpH4GTB0XW_Z2zOtW-w/45821179244-offset-4452.mp4',
	],
	[
		'https://www.twitch.tv/syntax_err0r/clip/TsundereFlirtyAlpacaPastaThat-3oJb5uauVu27g1mX',
		'https://clips-media-assets2.twitch.tv/AT-cm%7CbTiLS96CW-bmrlbtu4NZlw.mp4',
	],
	[
		'https://www.twitch.tv/zaktael/clip/AbstemiousBoxyPuppySwiftRage-fgZMHRdb9nbM61b7?filter=clips&range=7d&sort=time',
		'https://clips-media-assets2.twitch.tv/7XafpH4GTB0XW_Z2zOtW-w/45821179244-offset-4452.mp4',
	],
	[
		'https://clips.twitch.tv/VastDarkYakinikuFloof-9xPkFQXcpjYt7F1D?filter=clips&range=7d&sort=time',
		'https://clips-media-assets2.twitch.tv/hFRV4vcT5BUF3KY2LexdQw/AT-cm%7ChFRV4vcT5BUF3KY2LexdQw.mp4',
	],
])('', (url, expected) => {
	var puppet
	var output
	beforeAll(async () => {
		puppet = new cpuppeteer()
		await puppet.init(['--disable-web-security'])
		await puppet.goto('../src/OBSTwitchChat.html')
		await puppet.page.addStyleTag({
			content: `
				.chat {
				  
			  }`,
		})

		output = await puppet.page.evaluate(
			new Function(
				'url',
				'return new Promise(resolve => {resolve(fetchClipUrl(url))});'
			),
			url
		)

		await new Promise((r) => setTimeout(r, 1000))
	}, 20 * 1000)

	test(`clip url valide`, async () => {
		// console.log(output)
		await expect(output).toEqual(expected)
	})

	test('no errors', async () => {
		await expect(puppet.errors).toHaveLength(0)
	})

	afterAll(async () => {
		await puppet.close()
	})
})
