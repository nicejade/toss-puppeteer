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
let secretConfig = require('./../config/secretConfig')

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

$util.launchWeiboLogin = async(page) => {
  await page.type('#userId', secretConfig.weibo.account, { delay: 20 })
  await page.type('#passwd', secretConfig.weibo.password, { delay: 20 })

  let loginBtn = await page.$('.WB_btn_login')
  await loginBtn.click({delay: 20})

  await page.waitFor(600)
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

$util.waitForReadyStateComplete = (page) => {
  return new Promise((resolve, reject) => {
    $util.isLoadingFinished(page)
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
