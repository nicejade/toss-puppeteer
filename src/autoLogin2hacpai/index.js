const puppeteer = require('puppeteer-core')
const chalk = require('chalk')
const $util = require('./../helper/util.js')

const options = {
  headless: false, 
  executablePath: $util.getExecutablePath()
}
const secretConfig = require('./../config/secret')

;(async () => {
  const browser = await puppeteer.launch(options)
  const page = await browser.newPage()
  await page.goto('https://hacpai.com/login')
  page
    .waitForSelector('img')
    .then(() => {
      console.log(chalk.green('Okoy, Start Login!'))
      startLogin()
    })
  
  const startLogin = async () => {
    await page.click('#verifyHacpaiIcon', {delay: 20})
    await page.waitFor(2 * 1000)
    await page.type('#nameOrEmail', secretConfig.hacpai.account, { delay: 20 })
    await page.type('#loginPassword', secretConfig.hacpai.password, { delay: 20 })
    const loginBtn = await page.$('#loginBtn')
    await loginBtn.click({delay: 20})

    console.log(chalk.green('Okoy, Start Checkin!'))
    startCheckin()
  }

  const startCheckin = async () => {
    await $util.waitForReadyStateComplete(page)
    await page.click('.side__title', {delay: 20})
    await page.waitFor('a.green')
    await page.click('a.green', {delay: 20})
    console.log(chalk.green('Congratulations, Has successfully checked in.'))

    await page.waitFor(1 * 1000)
    await page.close()
    await browser.close()
  }
})()
