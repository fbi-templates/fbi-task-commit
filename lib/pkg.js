const path = require('path')

const root = process.cwd()

async function pkgExist () {
  return ctx.utils.fs.exist(path.join(root, 'package.json'))
}

function readPkg () {
  return require(path.join(root, 'package.json'))
}

module.exports = { pkgExist, readPkg }
