const puppeteer = require('puppeteer')
const chalk = require('chalk')
const ora = require('ora')

const $util = require('./../helper/util.js')
const $config = require('./config.js')

env.NODE_ENV = process.env.NODE_ENV || 'production'

$util.setConfig($config)

puppeteer.launch({ headless: true }).then(async browser => {
  let page = await browser.newPage()
  page.setViewport({ width: 1024, height: 2048 })

  page
    .waitForSelector('img')
    .then(async() => {
      if ($config.isNeedLogin) {
        if (await $util.isLogin(page)) {} else {
          $util.launchLogin(page).then(() => {
            executeSharePlan(browser, page)
          })
        }
      } else {
        executeSharePlan(browser, page)
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

  await page.goto($config.shareTargetPath)
})

const getContentYouWantShare = async(browser) => {
  let pageLimit = 4
  let pageNum = $util.getRandom(1, pageLimit)

  let page = await browser.newPage()
  page.setViewport({ width: 1536, height: 900 })

  let linkSuffix = pageNum > 1 ? `page/${pageNum}` : ''
  await page.goto($config.currentPageUrl + linkSuffix)

  await page.evaluate(async() => {
    let targetLinkList = [...document.querySelectorAll('#archive-page .post a')]
    let itemLimit = targetLinkList.length
    let itemNum = Math.round(Math.random() * (itemLimit - 1) + 1)

    itemNum = Math.ceil(itemNum, itemLimit)
    targetLinkList.forEach((item, index) => {
      if (itemNum === index) {
        item.click()
      }
    })
  })

  await $util.waitForTimeout($config.pageCommonWaitTime)
  // await $util.waitForLoadComplete(page)

  $util.executeScreenshot(page)

  let currentUrl = await page.url()
  let needShareContent = await $util.getWebPageInfo(currentUrl)
  needShareContent.url = currentUrl

  // page.close()
  return needShareContent
}

const executeSharePlan = async(browser, page) => {
  let spinnerGetContent = ora('Start crawling content you want share...\n')
  spinnerGetContent.start()
  let shareContent = await getContentYouWantShare(browser)
  spinnerGetContent.stop()

  await page.evaluate(async() => {
    let navbarList = [...document.querySelectorAll('.panel-body a')]
    navbarList.forEach(item => {
      if (item.href.includes('api.weibo.com')) {
        item.click()
      }
    })
  })

  await $util.waitForTimeout($config.pageCommonWaitTime)

  // -----------微博登录---------;
  await $util.launchLogin(page)

  await $util.waitForTimeout($config.requestLoginWaitTime)

  let titleInput = await page.$('[name=title]')
  await titleInput.click()
  await page.type(shareContent.title, { delay: 20 })

  let urlInput = await page.$('[name=url]')
  await urlInput.click()
  await page.type(shareContent.url, { delay: 20 })

  let summaryInput = await page.$('[name=summary]')
  await summaryInput.click()
  await page.type(shareContent.desc, { delay: 20 })

  let sublimtBtn = await page.$('[type=submit]')
  await sublimtBtn.click()

  console.log(chalk.green('So nice, Has been automatically help you to complete the sharing. The content is as follows: '))
  console.log(shareContent)
}
