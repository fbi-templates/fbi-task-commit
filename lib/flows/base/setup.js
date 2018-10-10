const exec = require('../../helpers/exec')
const status = require('../../helpers/status')

module.exports = async (configs, statusCheck) => {
  // const branches = await status.branches()
  // for (let [key, val] of Object.entries(configs.branch)) {
  //   if (!branches.includes(val)) {
  //     await exec(`git branch ${val} master`)
  //     await exec(`git push --set-upstream origin ${val}`, {
  //       ignoreStderr: true
  //     })
  //   }
  // }
}
