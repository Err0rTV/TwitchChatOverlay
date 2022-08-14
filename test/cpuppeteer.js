const puppeteer = require('puppeteer')
path = require('path')
const { blue, cyan, green, magenta, red, yellow } = require('colorette')

class cpuppeteer {
	constructor() {
		this.clearlog()
	}
	async init(args) {
		this.browser = await puppeteer.launch({
			// headless: 'chrome',
			args: args,
		})
		this.page = await this.browser.newPage()
		this.page
			.on('console', (message) => {
				// console.log(message.type())
				switch (message.type()) {
					case 'log':
						this.output.push(message.text())
						break
					case 'error':
						this.errors.push(message.text())
						break
				}
				// console.log(loutput)
			})
			.on('pageerror', ({ message }) => {
				this.errors.push(message)
				// console.log(red(message))
			})
		// .on('response', response => console.log(green(`${response.status()} ${response.url()}`)))
		// .on('requestfailed', request => console.log(magenta(`${request.failure().errorText} ${request.url()}`)))
	}
	clearlog() {
		this.output = []
		this.errors = []
	}
	async goto(page) {
		await Promise.all([
			this.page.coverage.startJSCoverage(),
			this.page.coverage.startCSSCoverage(),
		])
		await this.page.goto(`file:${path.join(__dirname, page)}`)
		const [jsCoverage, cssCoverage] = await Promise.all([
			this.page.coverage.stopJSCoverage(),
			this.page.coverage.stopCSSCoverage(),
		])
	}
	async close() {
		this.browser.close()
	}
}

module.exports = cpuppeteer
