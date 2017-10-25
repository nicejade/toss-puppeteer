const puppeteer = require('puppeteer')
const cheerio = require('cheerio')
const axios = require('axios')
const chalk = require('chalk')
const mapLimit = require('async/mapLimit')

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
      executeCrawlPlan(browser, page)
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

  await page.goto($config.targetWebsite)
})

const getArticleLink = (url) => {
  return new Promise((resolve, reject) => {
    return axios.get(url).then((res) => {
      try {
        let $ = cheerio.load(res.data)
        let aHrefList = []
        $('#archive-page .post a').each(function (i, e) {
          let item = {
            href: $(e).attr('href'),
            title: $(e).attr('title')
          }
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
          executePrintPlan(browser, articleLinkArr)
        }
      })
    }(item))
  })
}

let concurrencyCount = 0
const printPageToPdf = async (browser, item, callback) => {
  page = await browser.newPage()
  concurrencyCount++
  console.log(`现在的并发数是: ${concurrencyCount},正在打印的是：${item.href}`)
  await page.goto($config.targetOrigin + item.href)
  await page.waitFor(1000)
  $util.executePrintToPdf(page)
  await page.waitFor(1000)
  concurrencyCount--
  callback()
}

const executePrintPlan = async (browser, source) => {
  mapLimit(source, 5, (item, callback) => {
    printPageToPdf(browser, item, callback)
  })

  // browser.close()
}
