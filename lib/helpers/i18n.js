const i18next = require('i18next')
const resources = require('../lang/resources')

module.exports = (lng = 'cn') => {
  return new Promise((resolve, reject) => {
    i18next.init(
      {
        lng,
        resources
      },
      (err, t) => {
        if (err) {
          reject(err)
        }

        resolve(t)
      }
    )
  })
}
