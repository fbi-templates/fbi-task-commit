const path = require('path')

const root = process.cwd()

async function exist () {
  return ctx.utils.fs.exist(path.join(root, 'package.json'))
}

function read () {
  return require(path.join(root, 'package.json'))
}

function write (obj) {
  return ctx.utils.fs.write(
    path.join(root, 'package.json'),
    JSON.stringify(obj, null, 2)
  )
}

module.exports = {
  exist,
  read,
  write
}
