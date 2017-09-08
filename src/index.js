const puppeteer = require('puppeteer')
const chalk = require('chalk')

const $util = require('./util.js')
const $config = require('./config.js')

puppeteer.launch({headless: false}).then(async browser => {
  let page = await browser.newPage()
  page.setViewport({width: 1536, height: 900})

  page
    .waitForSelector('img')
    .then(async () => {
      if ($util.isNeedLogin) {
        if (await $util.isLogin(page)) {
        } else {
          $util.launchLogin(page).then(() => {
            $util.executeWorkarea(page)
          })
        }
      } else {
        $util.executeWorkarea(page)
      }
    })

  page.on('requestfinished', result => {
    if (result.url.includes('clustrmaps.com')) {
      $util.onListenUrlChange(page)
    }
  })

  page.on('error', (error) => {
    console.log(chalk.red('whoops! there was an error'))
    console.log(error)
  })

  page.on('pageerror', (error) => {
    console.log(chalk.red('whoops! there was an pageerror'))
    console.log(error)
  })

  await page.goto($config.currentPageUrl)
  // browser.close()
})
