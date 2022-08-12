path = require('path');
const puppeteer = require('puppeteer');

var page

(async () => {
  const browser = await puppeteer.launch({
    headless: 'chrome',
    args: [
		"--disable-web-security"
    ],
  });



  page = await browser.newPage();

  const { blue, cyan, green, magenta, red, yellow } = require('colorette')
  page
    .on('console', message => {
      const type = message.type().substr(0, 3).toUpperCase()
      const colors = {
        LOG: text => text,
        ERR: red,
        WAR: yellow,
        INF: cyan
      }
      const color = colors[type] || blue
      console.log(color(`${type} ${message.text()}`))
    })
    .on('pageerror', ({ message }) => console.log(red(message)))
    .on('response', response =>
      console.log(green(`${response.status()} ${response.url()}`)))
    .on('requestfailed', request =>
      console.log(magenta(`${request.failure().errorText} ${request.url()}`)))

  await page.goto(`file:${path.join(__dirname, 'src/OBSTwitchChat.html')}`);
  //   --chatbox-token: oaukth:00000;
  await page.addStyleTag({content: `
  .chat {
	--chatbox-messagesHideDelay: 15;
	--chatbox-testMode: 2;
}`})

await page.evaluate(() => {
	let t = 2
	console.log(t)
  });

//  await page.screenshot({path: 'example.png'});


await setTimeout(()=>{browser.close()	}, 5000)
//  await browser.close();


})();