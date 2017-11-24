const puppeteer = require('puppeteer')

puppeteer.launch({ headless: false }).then(async browser => {
  const page = await browser.newPage()
  let currentURL
  page
    .waitForSelector('img')
    .then(() => console.log('First URL with image: ' + currentURL))
    for (currentURL of ['https://jeffjade.com', 'https://google.com', 'https://blog.lovejade.cn']){
			console.log('Current URL Is: ' + currentURL)
			await page.goto(currentURL)
    }
  	await browser.close()
})

