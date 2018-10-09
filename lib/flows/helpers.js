const utils = require('../helpers/utils')

module.exports = {
  a () {
    console.log('a')
  },
  'remove-stale-branches': utils.rmStaleBranches,
  'clean-up': utils.cleanUp
}
