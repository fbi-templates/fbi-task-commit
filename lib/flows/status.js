const status = require('../helpers/status')

module.exports = async () => {
  if (await status.changes()) {
    await status.show()
  } else {
    console.log('working tree clean')
  }

  const unpushed = await status.unpushed()

  if (unpushed) {
    console.log(`\nunpushed commits (${unpushed.length}):`)
    console.log(`${unpushed.join('\n')}\n`)
  }
}
