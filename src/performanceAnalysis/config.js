require('shelljs/global')

const cSaveTracePath = './dist/trace/'

rm('-rf', cSaveTracePath)
mkdir('-p', cSaveTracePath)

module.exports = {
  targetWebsite: 'https://nicelinks.site/explore/skill',
  targetOrigin: 'https://nicelinks.site/explore/skill',
  saveTracePath: cSaveTracePath
}
