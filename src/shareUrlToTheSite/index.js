const puppeteer = require('puppeteer-core')
const ora = require('ora')
const $util = require('./../helper/util.js')
const $config = require('./config.js')

env.NODE_ENV = process.env.NODE_ENV || 'production'

$util.setConfig($config)

const options = { 
  headless: true, 
  slowMo: 20,
  executablePath: $util.getExecutablePath()
}

puppeteer.launch(options).then(async browser => {
  let page = (await browser.pages())[0]
  page.setViewport({ width: 1024, height: 2048 })

  $util.setPageWatcher(page)

  page.on('requestfinished', result => {
  })

  if (!$config.targetShareUrl) {
    $util.printWithColor(`❕ Please specify the URL you want to share.`, 'warning')
    page.close()
    browser.close()
    return
  }

  page
    .waitForSelector('img')
    .then(async() => {
      executeSharePlan(browser, page)
    })

  await page.goto($config.targetSitePath)
})

const grabContentYouWantShare = async (browser) => {
  let page = (await browser.pages())[0]
  page.setViewport({ width: 1536, height: 900 })

  page.goto($config.targetShareUrl)

  await $util.waitForReadyStateComplete(page)

  await page.waitFor(1 * 1000)

  let currentUrl = await page.url()
  $util.printWithColor(`✔ The links that are about to be shared are: ${currentUrl}`, 'success')
  let needShareContent = await $util.getWebPageInfo(currentUrl)
  needShareContent.url = currentUrl

  setTimeout(() => { page.close() }, 2 * 1000)
  return needShareContent
}

const executeSharePlan = async (browser, page) => {
  let getContentOra = ora('Start crawling content you want share...   ')
  getContentOra.start()
  let shareContent = await grabContentYouWantShare(browser)
  getContentOra.stop()
  $util.printWithColor('✔ Okay, It has been captured and the contents are as follows：', 'success')
  console.log(shareContent)

  let jump2WeiboOra = ora(`(need login with weibo)Okay, Let's jump to there...`)
  jump2WeiboOra.start()
  const jump2WeiboBtn = await page.$('.panel-body a')
  await jump2WeiboBtn.click({delay: 20})
  jump2WeiboOra.stop()

  await $util.waitForReadyStateComplete(page)
  await page.waitFor(2 * 1000)

  // -----------微博登录---------Start;
  let weiboLoginOra = ora('Start logging in sina-weobo ...')
  weiboLoginOra.start()
  await $util.launchWeiboLogin(page)
  weiboLoginOra.stop()
  // -----------微博登录---------End;

  await page.waitFor(2 * 1000)

  let startShare = ora('✔ Okay, Let puppeteer start to finish the last step - share it ...')
  await page.type($config.targetSiteCommitFormInfo.title, shareContent.title, { delay: 20 })
  await page.type($config.targetSiteCommitFormInfo.url, shareContent.url, { delay: 20 })
  await page.type($config.targetSiteCommitFormInfo.desc, shareContent.desc, { delay: 20 })
  startShare.start()

  let sublimtBtn = await page.$($config.targetSiteCommitFormInfo.btn)
  await sublimtBtn.click()
  startShare.stop()

  $util.printWithColor('✔ So nice, Has been automatically help you to complete the sharing.', 'success')
  // Shut down automatically after (10 * 1000)ms, If you did not do anything.
  await page.waitFor(10 * 1000)
  await page.close()
  await browser.close()
}
