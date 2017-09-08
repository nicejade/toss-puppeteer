const chalk = require('chalk')

const $config = require('./config.js')

let $util = {},
  screenshotNameList = []

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

$util.launchLogin = async (page) => {
  return new Promise(async (resolve, reject) => {
    await $util.executeDelay($config.requestLoginWaitTime)

    let loginUserInput = await page.$('[name=loginUserName]')
    await loginUserInput.click()
    await page.type($config.loginUserName, {delay: 20})

    let loginPwdInput = await page.$('[name=loginUserPwd]')
    await loginPwdInput.click()
    await page.type($config.loginUserPwd, {delay: 20})

    let loginBtn = await page.$('.login-box .el-button')
    await loginBtn.click()
    resolve(true)
  })
}

$util.getCurrentFullPath = (page) => {
  return page.evaluate(() => {
    return Promise.resolve(document.location.href)
  })
}

/*
  Desc: 页面请求是否完成✅，根据是否可见"el-loading-mask"(evaluate方法内不能显示执行 console 方法)；
 */
$util.isLoadingFinished = (page) => {
  return page.evaluate(() => {
    let elLoadingMasList = document.getElementsByClassName('el-loading-mask')
    for (let item of elLoadingMasList) {
      if (item.style.display !== 'none') {
        return Promise.resolve(false)
      }
    }
    return Promise.resolve(true)
  })
}

$util.executeScreenshot = async (page) => {
  if (await $util.isLoadingFinished(page)) {
    let pageTitle = await page.title()
    await page.screenshot({path: `${$config.screenshotPath}${pageTitle}.png`, type: 'png'})

    let currentUrl = await $util.getCurrentFullPath(page)
    console.log(chalk.magenta(`${currentUrl} 已截屏并保存为：${pageTitle}.png`))
    if (currentUrl.includes('workarea/proxysetting')) {
      console.log(chalk.green('Nice, Workarea Section Is Okay.'))
    }
  } else {
    setTimeout(() => {
      $util.executeScreenshot(page)
    }, 100)
  }
}

$util.onListenUrlChange = async (page) => {
  let pageTitle = await page.title()
  // let pageUrl = await page.url()
  if (!screenshotNameList.includes(pageTitle)) {
    screenshotNameList.push(pageTitle)

    // (!!NeedFix*)延迟截屏，使所得页面可以尽可能接近最终渲染所得;
    !(function (page) {
      $util.executeScreenshot(page)
    }(page))
  }
}

$util.executeDelay = function (delay) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(1)
      } catch (e) {
        reject(0)
      }
    }, delay)
  })
}

$util.executeWorkarea = async (page) => {
  await $util.executeDelay($config.requestLoginWaitTime)

  // 该方法添加了一个制定函数，在页面 window 对象上调用的。
  await page.exposeFunction('screenshot', async fileName => {
    return new Promise((resolve, reject) => {
      try {
        page.screenshot({path: `${$config.screenshotPath}${fileName}.png`, type: 'png'})
        resolve(true)
      } catch (err) {
        reject(err)
      }
    })
  })

  await page.evaluate(async () => {
    let workareaItem = [...document.querySelectorAll('.nav-workarea .el-menu-item')]
    let delayTime = 0
    for (elem of workareaItem) {
      delayTime += 2000
      !(function (_elem, _delayTime) {
        setTimeout(() => {
          _elem.click()
        }, _delayTime)
      }(elem, delayTime))
    }
    return Promise.resolve({})
  })
}

module.exports = $util
