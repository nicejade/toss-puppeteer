const puppeteer = require('puppeteer')
const chalk = require('chalk')

const $util = require('./../helper/util.js')
const $config = require('./config.js')

$util.setConfig($config)

puppeteer.launch({ headless: false }).then(async browser => {
  let page = await browser.newPage()
  page.setViewport({ width: 1536, height: 900 })

  page
        .waitForSelector('img')
        .then(async() => {
          if ($util.isNeedLogin) {
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
    let itemLimit = 10
    let itemNum = Math.round(Math.random() * (itemLimit - 1) + 1)

    itemNum = Math.ceil(itemNum, targetLinkList.length)
    targetLinkList.forEach((item, index) => {
      if (itemNum === index) {
        item.click()
      }
    })
  })

  await $util.executeDelay(2000)

  $util.executeScreenshot(page)

  let currentUrl = await page.url()
  let needShareContent = await $util.getWebPageInfo(currentUrl)
  needShareContent.url = currentUrl

  // page.close()
  return needShareContent
}

const executeSharePlan = async(browser, page) => {
  let shareContent = await getContentYouWantShare(browser)

  await page.evaluate(async() => {
    let navbarList = [...document.querySelectorAll('.panel-body a')]
    navbarList.forEach(item => {
      if (item.href.includes('api.weibo.com')) {
        item.click()
      }
    })
  })

  await $util.executeDelay(2000)

  // -----------微博登录---------;
  await $util.launchLogin(page)

  await $util.executeDelay($config.requestLoginWaitTime)

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
