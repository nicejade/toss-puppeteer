const chalk = require('chalk')
let axios = require('axios')
let cheerio = require('cheerio')

const $config = require('./../config.js')

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

$util.launchLogin = async(page) => {
    return new Promise(async(resolve, reject) => {
        await $util.executeDelay($config.requestLoginWaitTime)

        let loginUserInput = await page.$('[name=loginUserName]')
        await loginUserInput.click()
        await page.type($config.loginUserName, { delay: 20 })

        let loginPwdInput = await page.$('[name=loginUserPwd]')
        await loginPwdInput.click()
        await page.type($config.loginUserPwd, { delay: 20 })

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

$util.executeScreenshot = async(page) => {
    if (await $util.isLoadingFinished(page)) {
        let pageTitle = await page.title()
        await page.screenshot({ path: `${$config.screenshotPath}${pageTitle}.png`, type: 'png' })

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

$util.onListenUrlChange = async(page, callback) => {
    let pageTitle = await page.title()
    // let pageUrl = await page.url()
    if (!screenshotNameList.includes(pageTitle)) {
        screenshotNameList.push(pageTitle)

            // (!!NeedFix*)延迟截屏，使所得页面可以尽可能接近最终渲染所得;
            !(function(page) {
                callback && callback()
                $util.executeScreenshot(page)
            }(page))
    }
}

$util.executeDelay = function(delay) {
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


$util.getRandom = (n, m) => {
    return Math.round(Math.random() * (m - n) + n)
}

$util.getContentYouWantShare = async(browser) => {
    let pageLimit = 13
    let pageNum = $util.getRandom(1, pageLimit)

    let page = await browser.newPage()
    page.setViewport({ width: 1536, height: 900 })

    await page.goto($config.currentPageUrl + pageNum)

    await page.evaluate(async() => {
        let targetLinkList = [...document.querySelectorAll('#archive-page .post a')]
        let itemLimit = 10
        let itemNum = Math.round(Math.random() * (itemLimit - 1) + 1)

        targetLinkList.forEach((item, index) => {
            if (itemNum === index) {
                item.click()
            }
        })
    })

    await $util.executeDelay(2000)

    let currentUrl = await page.url()
    let needShareContent = await $util.getWebPageInfo(currentUrl)
    needShareContent.url = currentUrl

    page.close()
    return needShareContent
}

$util.getWebPageInfo = (url) => {
    return new Promise((resolve, reject) => {
        return axios.get(url).then((res) => {
            try {
                let $ = cheerio.load(res.data)
                let description = $('meta[name="description"]').attr('content')
                let result = {
                    title: $("title").text() || $('meta[og:title"]').attr('content'),
                    desc: description || $('meta[property="og:description"]').attr('content')
                }
                resolve(result)
            } catch (err) {
                console.log("Opps, Download Error Occurred !" + err)
                resolve({})
            }
        }).catch(err => {
            console.log("Opps, Axios Error Occurred !" + err)
            resolve({})
        })
    })
}

$util.executeSharePlan = async(browser, page) => {
    // await $util.executeDelay($config.requestLoginWaitTime)

    // 该方法添加了一个制定函数，在页面 window 对象上调用的。
    /*await page.exposeFunction('screenshot', async fileName => {
      return new Promise((resolve, reject) => {
        try {
          page.screenshot({path: `${$config.screenshotPath}${fileName}.png`, type: 'png'})
          resolve(true)
        } catch (err) {
          reject(err)
        }
      })
    })*/
    let shareContent = await $util.getContentYouWantShare(browser)
    console.log(shareContent)

    await page.evaluate(async() => {
        let navbarList = [...document.querySelectorAll('.navbar-brand')]
        navbarList.forEach(item => {
          if (item.href.includes('submit.php')) {
            item.click()
          }
        })
        // return Promise.resolve({})
    })

    await $util.executeDelay(2000)

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
}

module.exports = $util