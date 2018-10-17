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
    release: {
      production: {
        on: 'production',
        mergeFrom: 'pre-production',
        delete: false,
        tag: true
      }
    },
    infix: '/'
  },
  actions: ['new branch', 'sync branch', 'release']
}
