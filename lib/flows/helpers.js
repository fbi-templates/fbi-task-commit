const exec = require('../helpers/exec')
const git = require('../helpers/git')

module.exports = {
  a () {
    console.log('a')
  },
  'remove-stale-branches': git.rmStaleBranches,
  'clean-up': git.cleanUp
}
