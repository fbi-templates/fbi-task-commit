module.exports = {
  branches: {
    main: 'master',
    'long-lived': {
      master: {
        protected: true
      }
    },
    'short-lived': {
      feature: {
        baseOn: 'master',
        mergeTo: 'master'
      },
      bugfix: {
        from: 'master',
        rebase: 'master'
      }
    },
    infix: '/'
  },
  actions: ['new branch', 'sync branch', 'release']
}
