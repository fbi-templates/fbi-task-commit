const status = require('../../helpers/status')

module.exports = async ({ configs, utils }) => {
  if (await status.changes()) {
    await status.show()
  } else {
    console.log('Working tree clean')
  }

  const unpushed = await status.unpushed(utils)

  if (unpushed) {
    console.log(`\nunpushed commits (${unpushed.length}):`)
    console.log(`${unpushed.join('\n')}\n`)
  }
}
