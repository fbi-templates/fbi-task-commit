const exec = require('./exec')
const utils = require('./utils')
const status = require('./status')

module.exports = async ({ base, baseProtected, name, statusCheck }) => {
  await exec(`git checkout ${base}`).catch(statusCheck)

  if (baseProtected) {
    await exec(`git reset --hard origin/${base}`)
  } else {
    await exec(`git merge --ff origin/${base}`).catch(statusCheck)
  }

  await exec(`git checkout -b ${name} ${base}`)
}
