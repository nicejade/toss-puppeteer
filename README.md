<h1 align="center">Toss Puppeteer</h1>
Try all kinds of toss about using GoogleChrome puppeteer

## 自动抓取指定网站文章分享至指定网站

这番折腾，是基于 `Puppeteer` 抓取某网页链接（ 具体是在 https://jeffjade.com/categories/Front-End/ 中随机出一篇），将其推送到[技术头条](http://blogread.cn/news/)；其目的在于：练习初步运用 `Puppeteer`。

### 运行命令
```
git clone https://github.com/nicejade/toss-puppeteer
npm i (更推荐 yarn)
npm run shareBlogToBlogread
```
### 步骤详述
- [X] 打开[技术头条-提交页面](http://blogread.cn/news/submit.php)，同时到 [晚晴幽草轩-Front-End](https://jeffjade.com/categories/Front-End/) 随机抓取一篇文章，获取到标题、地址、描述。
- [X] 模拟人为操作，点开“用微博登录”按钮(会跳转至微博登录页面)；
- [X] 模拟人为操作，填充用户名和密码并“点击”登录按钮，完成登录(会重新跳转至[技术头条-提交页面](http://blogread.cn/news/submit.php))；
- [X] 模拟人为操作，填充之前获取到的标题、地址、描述，并“点击”提交，打完收工。
- [ ] 将其部署于服务器，并设置任务，定时间隔性执行，完成自动按时分享。

## 抓取指定网站页面并将其打印成 PDF

此番折腾，是基于 `Puppeteer` 抓取指定网站页面(示例是 https://jeffjade.com/  所有文章)，并将其打印成 PDF；其目的在于：进一步熟悉运用 `Puppeteer`。

### 运行命令
```
git clone https://github.com/nicejade/toss-puppeteer
npm i (更推荐 yarn)
npm run printWebsiteToPDF
```

### 步骤详述
- [X] 打开 https://jeffjade.com/archives 页面，从而得到博客文章总分页总数；
- [X] 运用 `axios` & `cheerio` 抓取分页并分析，从而得到网站所有文章链接，并存储；
- [X] 遍历所有链接（借助 `async` 控制并发），在页面渲染完成之后，将其打印成 PDF 并保存。

![使用 Puppeteer 抓取指定网站页面并将其打印成 PDF](https://raw.githubusercontent.com/nicejade/toss-puppeteer/master/screenshot/jeffjade-pdf.png)
