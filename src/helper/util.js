const chalk = require('chalk')
const axios = require('axios')
const cheerio = require('cheerio')

const typeList = {
  success: chalk.green,
  error: chalk.bold.red,
  warning: chalk.keyword('orange')
}

/**
// 帐号密码，你需要自己新增文件😊；secretConfig 配置大致样子，如下：
module.exports = {
  weibo: {
    account: 'your-weibo-account',
    password: 'your-weibo-password'
  }
}
*/
let secretConfig = require('./../config/secret')

let $util = {},
  $config = null,
  screenshotNameList = []

$util.setConfig = (config) => {
  $config = config
}

$util.printWithColor = (str, type = '', color = 'white') => {
  let colorFunc = typeList[type] || chalk[color]
  console.log(colorFunc(str))
}

$util.isLogin = (page) => {
  return new Promise((resolve, reject) => {
    return page.cookies($config.currentPageUrl).then(result => {
      for (item of result) {
        if (item.name === 'LoginCookie' && item.value === 'true') {
          resolve(true)
        }
      }
      resolve(false)
    })
  })
}

$util.launchWeiboLogin = async (page) => {
  try {
    console.log('Info: The configured micro-blog account information is as follows：')
    console.log(secretConfig.weibo)

    await page.type('#userId', secretConfig.weibo.account, { delay: 20 })
    await page.type('#passwd', secretConfig.weibo.password, { delay: 20 })

    // UnhandledPromiseRejectionWarning: Unhandled promise rejection (rejection id: 2): TypeError: Cannot read property 'click' of null
    let loginBtn = await page.$('.WB_btn_login')
    await loginBtn.click({delay: 20})

    await page.waitFor(600)
    return Promise.resolve(1)
  } catch (error) {
    $util.printWithColor('whoops! Errors appear when launchWeiboLogin：', 'error')
    console.log(error)
    return Promise.resolve(0)
  }
}

$util.launchGithubLogin = async(page) => {
  try {
    await page.goto('https://github.com/login')

    await page.type('#login_field', secretConfig.github.account, { delay: 20 })
    await page.type('#password', secretConfig.github.password, { delay: 20 })

    let loginBtn = await page.$('[name=commit]')
    await loginBtn.click({delay: 20})

    await page.waitFor(600)
    return Promise.resolve(1)
  } catch (error) {
    return Promise.resolve(0)
  }
}

$util.setPageWatcher = (page) => {
  page.on('requestfailed', error => {
    console.log(chalk.red(`whoops! request failed： ${error.url}`))
  })

  page.on('error', (error) => {
    console.log(chalk.red('whoops! there was an error'))
    console.log(error)
  })

  page.on('pageerror', (error) => {
    console.log(chalk.red('whoops! there was an pageerror'))
    console.log(error)
  })
}

$util.getCurrentFullPath = (page) => {
  return page.evaluate(() => {
    return Promise.resolve(document.location.href)
  })
}

/**
 * @Author   nicejade
 * @DateTime 2017-09-18
 * @param    {Object}   page [browser实例Page]
 * @return   {Boolean}       [页面是否加载完毕]
 */
$util.isLoadingFinished = (page) => {
  return page.evaluate(() => {
    // document.readyState: loading / 加载；interactive / 互动；complete / 完成
    return document.readyState === 'complete'
  })
}

$util.executeScreenshot = async(page) => {
  if (await $util.isLoadingFinished(page)) {
    let pageTitle = await page.title()
    await page.screenshot({ path: `${$config.screenshotPath}${pageTitle}.png`, type: 'png' })

    let currentUrl = await $util.getCurrentFullPath(page)
    console.log(chalk.magenta(`${currentUrl} Has been screened and saved as：${pageTitle}.png`))
  } else {
    setTimeout(() => {
      $util.executeScreenshot(page)
    }, 100)
  }
}

$util.executePrintToPdf = async(page) => {
  if (await $util.isLoadingFinished(page)) {
    let pageTitle = await page.title()
    await page.pdf({path: `${$config.savePdfPath}${pageTitle}.pdf`})
    console.log(chalk.magenta(`Pages that have been printed in PDF format is: ${pageTitle}`))
    page.close()
  } else {
    setTimeout(() => {
      $util.executePrintToPdf(page)
    }, 100)
  }
}

$util.onListenUrlChange = async(page, callback) => {
  let pageTitle = await page.title()
  if (!screenshotNameList.includes(pageTitle)) {
    screenshotNameList.push(pageTitle)

    // (!!NeedFix*)延迟截屏，使所得页面可以尽可能接近最终渲染所得;
    !(function (page) {
      callback && callback()
      $util.executeScreenshot(page)
    }(page))
  }
}

/*
  Equivalent to the default method: page.waitFor(Timeout)
 */
$util.waitForTimeout = (delay) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(true)
      } catch (e) {
        reject(false)
      }
    }, delay)
  })
}

/**
 * @Author   nicejade
 * @DateTime 2017-11-28
 * @param    {[type]}   page        [Browser 实例 Page]
 * @param    {Number}   timesLimit  [等待页面加载完的成轮询次数，默认 600]
 * @param    {Number}   cycleFactor [每次轮询的间隔时间(ms)，默认 10]
 * @return   {Boolean}              [等待(timesLimit*cycleFactor)ms后，页面是否加载完毕]
 */
$util.waitForReadyStateComplete = (page, timesLimit = 600, cycleFactor = 10) => {
  return new Promise(async (resolve, reject) => {
    let i = 0
    while (i < timesLimit) {
      $util.printWithColor(`♻️  Wait for page load completion，Now the number of polling is: ${i}`, '')
      if (await $util.isLoadingFinished(page)) {
        $util.printWithColor(`😊  Okay, The time to wait for the page to load to complete is: ${i * cycleFactor} ms`, 'success')
        return resolve(true)
      }
      i++
      await page.waitFor(cycleFactor)
    }
    $util.printWithColor('✘ Error: Timeout Exceeded: 30000ms exceeded', 'warning')
    return resolve(false)
  })
}

$util.getRandom = (n, m) => {
  return Math.round(Math.random() * (m - n) + n)
}

$util.getWebPageInfo = (url) => {
  return new Promise((resolve, reject) => {
    return axios.get(url).then((res) => {
      try {
        let $ = cheerio.load(res.data)
        let description = $('meta[name="description"]').attr('content')
        let result = {
          title: $('title').text() || $('meta[og:title"]').attr('content'),
          desc: description || $('meta[property="og:description"]').attr('content')
        }
        resolve(result)
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

module.exports = $util
