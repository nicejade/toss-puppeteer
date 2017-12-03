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

  $util.executeScreenshot(page)

  let currentUrl = await page.url()
  let needShareContent = await $util.getWebPageInfo(currentUrl)
  needShareContent.url = currentUrl

  setTimeout(() => { page.close() }, 100)
  return needShareContent
}

const executeSharePlan = async(browser, page) => {
  let getContentOra = ora('Start crawling content you want share...')
  getContentOra.start()
  let shareContent = await getContentYouWantShare(browser)
  getContentOra.stop()

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
  await $util.waitForTimeout($config.pageCommonWaitTime)
  jump2WeiboOra.stop()

  // -----------微博登录---------Start;
  let weiboLoginOra = ora('Start logging in sina-weobo ...')
  weiboLoginOra.start()
  await $util.launchWeiboLogin(page)
  weiboLoginOra.stop()

  await $util.waitForTimeout($config.requestLoginWaitTime)

  let startShare = ora('Start logging in sina-weobo ...')
  await page.type('[name=title]', shareContent.title, { delay: 20 })
  await page.type('[name=url]', shareContent.url, { delay: 20 })
  await page.type('[name=summary]', shareContent.desc, { delay: 20 })

  let sublimtBtn = await page.$('[type=submit]')
  await sublimtBtn.click()

  $util.printWithColor('So nice, Has been automatically help you to complete the sharing. The content is as follows: ', 'success')
  console.log(shareContent)
  await page.close()
  await browser.close()
}
