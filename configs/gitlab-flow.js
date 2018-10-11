module.exports = {
  branches: {
    main: 'develop',
    'long-lived': {
      master: {
        protected: true
      },
      'pre-production': {
        protected: true
      },
      production: {
        protected: true
      }
    },
    'short-lived': {
      feature: {
        baseOn: 'master',
        mergeTo: 'master'
      },
      bugfix: {
        baseOn: 'master',
        mergeTo: 'master'
      },
      hotfix: {
        baseOn: 'master',
        mergeTo: 'master'
      }
    },
    release: {
      'pre-production': {
        on: 'pre-production',
        mergeFrom: 'master',
        delete: false
      },
      production: {
        on: 'production',
        mergeFrom: 'pre-production',
        delete: false,
        tag: true
      }
    },
    infix: '/'
  },
  actions: [
    'new branch',
    'sync branch',
    'release pre-production',
    'release production'
  ]
}
