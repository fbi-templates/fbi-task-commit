const status = require('../helpers/status')

module.exports = async () => {
  let clean = true
  const allStatus = await status.getStatus()

  for (let [key, val] of Object.entries(allStatus)) {
    if (val) {
      console.log(`${key}:\n  ${val.join('\n  ')}`)
      clean = false
    }
  }
  if (clean) {
    console.log('working tree clean')
  }

  return allStatus
}
