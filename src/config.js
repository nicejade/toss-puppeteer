require('shelljs/global')
env.NODE_ENV = process.env.NODE_ENV || 'testing'

let screenshotPath = './screenshot/',
  currentPageUrl = 'https://jeffjade.com/',
  loginUserName = '',
  loginUserPwd = ''

// Clear & Rebuild Screenshot Directory
rm('-rf', screenshotPath)
mkdir('-p', screenshotPath)

module.exports = {
  currentPageUrl: currentPageUrl,
  screenshotPath: screenshotPath,
  // Request Logon Approximate Wait Time
  requestLoginWaitTime: 3000,
  // 页面停留大致等待时间
  pageCommonWaitTime: 2000,
  isNeedLogin: false,
  loginUserName: loginUserName,
  loginUserPwd: loginUserPwd
}

