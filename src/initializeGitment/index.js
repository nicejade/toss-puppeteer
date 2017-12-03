const puppeteer = require('puppeteer')
const cheerio = require('cheerio')
const axios = require('axios')
const chalk = require('chalk')
const ora = require('ora')
const mapLimit = require('async/mapLimit')

const $util = require('./../helper/util.js')
const $config = require('./config.js')

$util.setConfig($config)

puppeteer.launch({ headless: true }).then(async browser => {
  let page = await browser.newPage()
  page.setViewport({ width: 1024, height: 2048 })

  $util.setPageWatcher(page)

  page
    .waitForSelector('img')
    .then(async() => {
      executeCrawlPlan(browser, page)
    })

  await page.goto($config.targetWebsite)
})

const getArticleLink = (url) => {
  return new Promise((resolve, reject) => {
    return axios.get(url).then((res) => {
      try {
        let $ = cheerio.load(res.data)
        let aHrefList = []
        $util.printWithColor(`✔ The article has been crawled as follows：`, 'success')
        $('#archive-page .post a').each(function (i, e) {
          let item = {
            href: $(e).attr('href'),
            title: $(e).attr('title')
          }
          $util.printWithColor(`  ${item.title}: ${item.href}`)
          aHrefList.push(item)
        })
        return resolve(aHrefList)
      } catch (err) {
        console.log('Opps, Download Error Occurred !' + err)
        resolve({})
      }
    }).catch(err => {
      console.log('Opps, Axios Error Occurred !' + err)
      resolve({})
    })
  })
}

const executeCrawlPlan = async (browser, page) => {
  $util.printWithColor(`Start crawling all article links...`, 'success')
  let numList = await page.evaluate(async() => {
    let pageNumList = [...document.querySelectorAll('#page-nav .page-number')]
    return pageNumList.map(item => {
      return item.text
    })
  })
  // 获取到分页总数目(从左到右，有小到大，所以可以如下处置)
  let totalNum = +numList[numList.length - 1]
  let pageLinkArr = [$config.targetWebsite]
  for (let i = 2; i <= totalNum; i++) {
    pageLinkArr.push(`${$config.targetWebsite}/page/${i}`)
  }

  let articleLinkArr = []
  let statisticsCount = 0
  await pageLinkArr.forEach((item) => {
    !(function (citem) {
      getArticleLink(citem).then(result => {
        statisticsCount++
        articleLinkArr = articleLinkArr.concat(result)
        if (statisticsCount === totalNum) {
          startExecutePlan(browser, articleLinkArr)
        }
      })
    }(item))
  })
}

const findAndTriggerInitBtn = async (page) => {
  let currentPagePath = await $util.getCurrentFullPath(page)

  try {
    let gitmentLeditorLoginLink = await page.$('.gitment-editor-login-link')
    if (gitmentLeditorLoginLink) {
      $util.printWithColor(`✔ Have found Gitment Editor Login Link In: ${currentPagePath}`, '')
      await gitmentLeditorLoginLink.click({delay: 20})
    }
  } catch (error) {
    $util.printWithColor(` The Error Is: ${error}`, '')
  }

  page.waitForSelector('.gitment-comments-init-btn').then(async () => {
    $util.printWithColor(`The ongoing initialization is：${currentPagePath}`, '')
    let initGitmentBtn = await page.$('.gitment-comments-init-btn')
    await initGitmentBtn.click({delay: 20})
    $util.printWithColor(`✔ Complete initialization for ${currentPagePath}`, 'success')
    setTimeout(() => { page.close() }, 2000)
  }).catch(error => {
    $util.printWithColor(`⍻ Did not find the initialization button at ${currentPagePath}`, 'warning')
    $util.printWithColor(` The Error Is: ${error}`, '')
  })
}

let concurrentCount = 0
const executeInitializePlan = async (browser, item) => {
  let cpage = await browser.newPage()
  concurrentCount++
  $util.printWithColor(`Now the number of concurrent is: ${concurrentCount}, Trying for: ${item.href}`, '')
  await cpage.goto($config.targetOrigin + item.href)

  $util.setPageWatcher(cpage)

  cpage.on('requestfinished', result => {
    if (result.url.includes('gitment.browser.js')) {
      console.log('- Already loaded gitment.browser.js')
    }
  })
  cpage.waitForSelector('.gitment-editor-login-link').then(() => {
    findAndTriggerInitBtn(cpage)
    concurrentCount--
  }).catch(error => {
    if (error) {
      $util.printWithColor(`Opps, Something error(waitForSelector): ${error}`, 'error')
    }
  })
}

const startExecutePlan = async (browser, source) => {
  $util.printWithColor(`✔ Okay, Let me start implementing the nice plan.`, 'success')

  // --------------------Login With Github----------------------Start
  let githubLoginOra = ora('Start logging in github ...')
  githubLoginOra.start()
  let page = await browser.newPage()
  await $util.launchGithubLogin(page)
  githubLoginOra.stop()
  $util.printWithColor(`✔ Okay, Already done for you about github auto login.`, 'success')
  // --------------------Login With Github----------------------End

  let initGitmentOra = ora('Attempting to initialize gitment for all crawled pages ...')
  initGitmentOra.start()
  mapLimit(source, 3, async (item) => {
    await page.waitFor(1000)
    executeInitializePlan(browser, item)
  }, (error) => {
    if (error) {
      $util.printWithColor(`Opps, Something error: ${error}`, 'error')
    }
  })
  initGitmentOra.stop()
}
