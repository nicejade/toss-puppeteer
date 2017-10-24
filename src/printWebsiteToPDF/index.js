const puppeteer = require('puppeteer')
const cheerio = require('cheerio')
const axios = require('axios')
const chalk = require('chalk')

const $util = require('./../helper/util.js')
const $config = require('./config.js')

$util.setConfig($config)

puppeteer.launch({ headless: false }).then(async browser => {
  let page = await browser.newPage()
  page.setViewport({ width: 1024, height: 2048 })

  page
    .waitForSelector('img')
    .then(async() => {
      executePrintPlan(browser, page)
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
          aHrefList.push($config.targetOrigin + $(e).attr('href'))
        })
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


const executePrintPlan = async (browser, page) => {
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
  await pageLinkArr.forEach((item) => {
    !(function (citem) {
      getArticleLink(citem).then(result => {
        articleLinkArr.concat(result)
      })
    }(item))
  })
  await page.waitFor(10000)
  console.log(articleLinkArr)
}
