const puppeteer = require('puppeteer-core')
const chalk = require('chalk')
const ora = require('ora')

const $util = require('./../helper/util.js')
const $config = require('./config.js')

env.NODE_ENV = process.env.NODE_ENV || 'production'

$util.setConfig($config)

const options = { 
  headless: false, 
  executablePath: $util.getExecutablePath()
}

puppeteer.launch(options).then(async browser => {
  let page = await browser.newPage()
  page.setViewport({ width: 1024, height: 2048 })

  $util.setPageWatcher(page)

  page.on('requestfinished', result => {
    if (result.url.includes('www.google-analytics.com')) {
      $util.onListenUrlChange(page)
    }
  })

  page
    .waitForSelector('img')
    .then(async() => {
      if ($config.isNeedLogin) {
        if (await $util.isLogin(page)) {} else {
          $util.launchWeiboLogin(page).then(() => {
            executeSharePlan(browser, page)
          })
        }
      } else {
        executeSharePlan(browser, page)
      }
    })

  await page.goto($config.shareTargetPath)
})

const grabContentYouWantShare = async (browser) => {
  let pageLimit = 4
  let pageNum = $util.getRandom(1, pageLimit)

  let page = await browser.newPage()
  page.setViewport({ width: 1536, height: 900 })

  let linkSuffix = pageNum > 1 ? `page/${pageNum}` : ''

  // When add Await: There is a mistake as follows：
  // UnhandledPromiseRejectionWarning: Unhandled promise rejection (rejection id: 1): Error: Navigation Timeout Exceeded: 30000ms exceeded
  page.goto($config.currentPageUrl + linkSuffix)

  await $util.waitForReadyStateComplete(page)

  await page.waitFor(2 * 1000)

  await page.evaluate(() => {
    let targetLinkList = [...document.querySelectorAll('#archive-page .post a')]
    let itemLimit = targetLinkList.length
    if (itemLimit <= 0) return Promise.resolve([])

    let itemNum = Math.round(Math.random() * (itemLimit - 1) + 1)

    itemNum = Math.ceil(itemNum, itemLimit)
    targetLinkList.map((item, index) => {
      if (itemNum === index) {
        item.click()
        return Promise.resolve(1)
      }
    })
  })

  await page.waitFor(1 * 1000)

  $util.executeScreenshot(page)

  let currentUrl = await page.url()
  $util.printWithColor(`✔ The links that are about to be shared are: ${currentUrl}`, 'success')
  let needShareContent = await $util.getWebPageInfo(currentUrl)
  needShareContent.url = currentUrl

  setTimeout(() => { page.close() }, 2 * 1000)
  return needShareContent
}

const executeSharePlan = async (browser, page) => {
  let getContentOra = ora('Start crawling content you want share...')
  getContentOra.start()
  let shareContent = await grabContentYouWantShare(browser)
  getContentOra.stop()
  $util.printWithColor('✔ Okay, It has been captured and the contents are as follows：', 'success')
  console.log(shareContent)

  let jump2WeiboOra = ora(`(need login with weibo)Okay, Let's jump to there...`)
  jump2WeiboOra.start()
  await page.evaluate(async() => {
    let navbarList = [...document.querySelectorAll('.panel-body a')]
    navbarList.forEach(item => {
      if (item.href.includes('api.weibo.com')) {
        item.click()
      }
    })
  })
  await page.waitFor(1000)
  jump2WeiboOra.stop()

  // -----------微博登录---------Start;
  let weiboLoginOra = ora('Start logging in sina-weobo ...')
  weiboLoginOra.start()
  await $util.launchWeiboLogin(page)
  weiboLoginOra.stop()
  // -----------微博登录---------End;

  await page.waitFor(2 * 1000)

  let startShare = ora('✔ Okay, Let puppeteer start to finish the last step - share it ...')
  await page.type('#textTitle', shareContent.title, { delay: 20 })
  await page.type('#urlUrl', shareContent.url, { delay: 20 })
  await page.type('#summary', shareContent.desc, { delay: 20 })
  startShare.start()

  let sublimtBtn = await page.$('[type=submit]')
  await sublimtBtn.click()

  startShare.stop()
  $util.printWithColor('So nice, Has been automatically help you to complete the sharing.', 'success')

  await page.waitFor(30 * 1000)
  await page.close()
  await browser.close()
}
