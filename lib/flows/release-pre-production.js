const release = require('./release')

module.exports = async (configs, statusCheck) => {
  const baseBranch = configs.flow.branch['pre-production']
  await release(configs, statusCheck, baseBranch)
}
