require('shelljs/global')

const cSaveTracePath = './dist/trace/'

rm('-rf', cSaveTracePath)
mkdir('-p', cSaveTracePath)

module.exports = {
  targetWebsite: 'https://blog.lovejade.cn',
  targetOrigin: 'https://blog.lovejade.cn',
  saveTracePath: cSaveTracePath
}
