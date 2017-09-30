<h1 align="center">Toss Puppeteer</h1>
Try all kinds of toss about using GoogleChrome puppeteer

## 自动分享链接至指定网站

这番折腾，是基于 `Puppeteer` 抓取某网页链接（ 具体是在 https://jeffjade.com/categories/Front-End/ 中随机出一篇），将其推送到[技术头条](http://blogread.cn/news/)；其目的是：练习运用 `Puppeteer`的同时，寻找到一则分享博文的便捷方法。

### 运行命令
```
git clone https://github.com/nicejade/toss-puppeteer
npm i (yarn)
npm run shareBlogToBlogread
```
### 步骤详述
* 打开[技术头条-提交页面](http://blogread.cn/news/submit.php)，同时到 [晚晴幽草轩-Front-End](https://jeffjade.com/categories/Front-End/) 随机抓取一篇文章，获取到标题、地址、描述。
* 模拟人为操作，点开“用微博登录”按钮(会跳转至微博登录页面)；
* 模拟人为操作，填充用户名和密码并“点击”登录按钮，完成登录(会重新跳转至[技术头条-提交页面](http://blogread.cn/news/submit.php))；
* 模拟人为操作，填充之前获取到的标题、地址、描述，并“点击”提交，打完收工。
