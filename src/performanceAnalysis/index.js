const puppeteer = require('puppeteer')
const chalk = require('chalk')

const $util = require('./../helper/util.js')
const $config = require('./config.js')

$util.setConfig($config)

/*
  headless: true 注意产生PDF格式目前仅支持Chrome无头版。 (update@2017-10-25)
  NOTE Generating a pdf is currently only supported in Chrome headless.
  https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagepdfoptions
 */
puppeteer.launch({ headless: true }).then(async browser => {
  let page = await browser.newPage()
  page.setViewport({ width: 1024, height: 2048 })

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
      await browser.close()
    }
  })
})
