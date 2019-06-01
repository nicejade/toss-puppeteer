require('shelljs/global')

const cSavePdfPath = './dist/pdf/'

rm('-rf', cSavePdfPath)
mkdir('-p', cSavePdfPath)

module.exports = {
  targetWebsite: 'https://www.jeffjade.com/archives',
  targetOrigin: 'https://www.jeffjade.com',
  savePdfPath: cSavePdfPath
}
