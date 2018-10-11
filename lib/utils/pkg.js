const path = require('path')

const root = process.cwd()

async function pkgExist () {
  return ctx.utils.fs.exist(path.join(root, 'package.json'))
}

function readPkg () {
  return require(path.join(root, 'package.json'))
}

function writePkg (obj) {
  return ctx.utils.fs.write(
    path.join(root, 'package.json'),
    JSON.stringify(obj, null, 2)
  )
}

module.exports = {
  pkgExist,
  readPkg,
  writePkg
}
