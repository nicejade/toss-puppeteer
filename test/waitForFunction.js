const puppeteer = require('puppeteer')

puppeteer.launch({ headless: false }).then(async browser => {
  const page = await browser.newPage()
  const watchDog = page.waitForFunction('window.innerWidth < 100')
  setTimeout(() => {
    page.setViewport({width: 50, height: 50})
  }, 5000)
  await watchDog
  await browser.close()
})