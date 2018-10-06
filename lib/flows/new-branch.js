const inquirer = require('inquirer')
const exec = require('../helpers/exec')
const status = require('../helpers/status')
const utils = require('../helpers/utils')

module.exports = async (configs, statusCheck) => {
  let branchTypes
  if (configs.flow.customize) {
    branchTypes = Object.entries(configs.flow.customize).map(([key, val]) => ({
      name: `${key.padEnd(10, ' ')} ${val.description}`,
      value: `${val.prefix} ${val.base}`
    }))
  }
  console.log()
  const { types } = await inquirer.prompt({
    type: 'list',
    name: 'types',
    message: 'Select a branch type',
    choices: branchTypes
  })

  const { name } = await inquirer.prompt({
    type: 'input',
    name: 'name',
    message: 'Input the new branch name'
  })

  const prefix = types.split(' ')[0]
  const basebranch = configs.flow.branch[types.split(' ')[1] || 'base']
  const branchName = `${prefix}${name}`

  if (branchName) {
    await exec('git stash -u')
    await exec(`git checkout ${basebranch}`, {
      ignoreStderr: true
    })
    await exec('git fetch --prune', {
      ignoreStderr: true
    })
    await exec(`git reset --hard origin/${basebranch}`)

    // await exec(`git rebase origin/${basebranch}`).catch(async err => {
    //   console.log('err:', err.message)
    //   return statusCheck()
    // })
    await exec(`git checkout -b ${branchName} ${basebranch}`, {
      ignoreStderr: true
    })

    console.log(
      `\nnew branch '${branchName}' created base on '${basebranch}'\n`
    )
    const { push } = await inquirer.prompt({
      type: 'confirm',
      name: 'push',
      message: `${await utils.promptPrefix()} Push to remote`,
      default: true
    })

    if (push) {
      await exec(`git push --set-upstream origin ${branchName}`, {
        ignoreStderr: true
      })
    }

    const stashs = await status.stashs()
    if (stashs && stashs.length > 0) {
      await exec('git stash pop')
    }

    return false
  }

  return true
}
