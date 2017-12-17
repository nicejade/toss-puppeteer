require('shelljs/global')

const defaultShareUrl = ''
exports.targetShareUrl = process.env.URL || process.env.Url || process.env.url || ''

/* Default Setting is For Default targetSitePath(http://blogread.cn) */
exports.targetSitePath = 'http://blogread.cn/news/submit.php'
exports.targetSiteCommitFormInfo = {
  title: '#textTitle',
  url: '#urlUrl',
  desc: '#summary',
  btn: '[type=submit]'
}
