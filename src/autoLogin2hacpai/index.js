const puppeteer = require('puppeteer')

(async () => {
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  await page.goto('https://hacpai.com/')
  await page.click('#loginBtn')
  await page.click(':nth-child(3) > ul > .list > .side__title')
  await browser.close()
})()
