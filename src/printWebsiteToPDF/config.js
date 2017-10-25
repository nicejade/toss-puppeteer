require('shelljs/global')

const cSavePdfPath = './dist/pdf/'

rm('-rf', cSavePdfPath)
mkdir('-p', cSavePdfPath)

module.exports = {
  targetWebsite: 'https://jeffjade.com/archives',
  targetOrigin: 'https://jeffjade.com',
  savePdfPath: cSavePdfPath
}
