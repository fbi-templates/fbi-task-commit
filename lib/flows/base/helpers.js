const git = require('../../utils/git')
const helper = require('../../helper')

module.exports = {
  a () {
    console.log('a')
  },
  'remove-stale-branches': helper.rmStaleBranches,
  'clean-up': git.clean
}
