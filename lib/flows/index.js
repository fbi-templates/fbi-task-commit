module.exports = {
  status: require('./base/status'),
  commit: require('./base/commit'),
  rebase: require('./base/rebase'),
  setup: require('./base/setup'),
  helpers: require('./base/helpers'),
  exit () {
    process.exit(0)
  }
}
