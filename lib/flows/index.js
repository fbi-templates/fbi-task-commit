module.exports = {
  check: require('./base/check'),
  status: require('./base/status'),
  commit: require('./base/commit'),
  rebase: require('./base/rebase'),
  setup: require('./base/setup'),
  helpers: require('./base/helpers'),
  exit () {
    process.exit(0)
  },
  'switch-branch': require('./switch-branch'),
  'new branch': require('./new-branch'),
  'sync branch': require('./sync-branch'),
  release: require('./release')
}
