module.exports = {
  status: require('./status'),
  init: require('./init'),
  // check: require('./check-status').check,
  commit: require('./commit'),
  // 'new-branch': require('./new-branch'),
  // 'sync-branch': require('./sync-branch'),
  // rebase: require('./rebase'),
  // release: require('./release'),
  // 'release-pre-production': require('./release-pre-production'),
  // 'release-production': require('./release-production'),
  // 'show-status': require('./show-status'),
  helpers: require('./helpers'),
  exit () {
    process.exit(0)
  }
}
