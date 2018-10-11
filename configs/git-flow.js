module.exports = {
  branches: {
    main: 'develop',
    'long-lived': {
      master: {
        protected: true
      },
      develop: {
        baseOn: 'master',
        protected: true
      }
    },
    'short-lived': {
      feature: {
        baseOn: 'develop',
        mergeTo: 'develop'
      },
      bugfix: {
        baseOn: 'develop',
        mergeTo: 'develop'
      },
      hotfix: {
        baseOn: 'master',
        mergeTo: ['master', 'develop']
      }
    },
    release: {
      'pre-production': {
        prefix: 'release',
        baseOn: 'develop',
        mergeTo: ['master', 'develop'],
        delete: true
      },
      production: {
        prefix: 'release',
        baseOn: 'master',
        mergeTo: ['master', 'develop'],
        delete: true,
        tag: true
      }
    },
    infix: '/'
  },
  actions: [
    'new branch',
    'sync branch',
    'release-pre-production',
    'finish-release-pre-production',
    'release-production',
    'finish-release-production'
  ]
}
