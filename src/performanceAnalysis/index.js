const puppeteer = require('puppeteer-core')
const $util = require('./../helper/util.js')
const $config = require('./config.js')

$util.setConfig($config)

const options = { 
  headless: false, 
  executablePath: $util.getExecutablePath()
}

puppeteer.launch(options).then(async browser => {
  let page = await browser.newPage()
  page.setViewport({ width: 961, height: 526 })

  page
    .waitForSelector('img')
    .then(async() => {
      $util.printWithColor('✔ Oh，The img has already appeared on the page', 'success')
    })

  $util.setPageWatcher(page)

  await page.tracing.start({path: $config.saveTracePath + 'trace.json', screenshots: true})
  await page.goto($config.targetWebsite)
  await $util.waitForReadyStateComplete(page).then(async (result) => {
    if (result) {
      $util.printWithColor('✔ Okay，The page has been loaded, and saved trace.json', 'success')
      await page.tracing.stop()
      await page.waitFor(1000)
      let pageTitle = await page.title()
      await page.screenshot({ path: `${$config.saveTracePath}${pageTitle}.png`, type: 'png' })
      await browser.close()
    }
  })
})
