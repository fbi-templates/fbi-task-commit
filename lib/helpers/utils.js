const chalk = require('chalk')
const status = require('./status')

exports.promptPrefix = async () =>
  `[${chalk.magenta(await status.currentBranch({ quiet: true }))}]`
