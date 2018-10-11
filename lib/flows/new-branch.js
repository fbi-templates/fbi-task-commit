const newBranchHelper = require('../helpers/new-branch')

module.exports = async ({
  configs,
  status,
  utils,
  inquirer,
  exec,
  statusCheck
}) => {
  const messagePrefix = await utils.promptPrefix()

  const { branchType } = await inquirer.prompt({
    type: 'list',
    name: 'branchType',
    message: `${messagePrefix} ${utils.t('title.chooseBranchType')}`,
    choices: Object.keys(configs.branches['short-lived'])
  })

  const { branchName } = await inquirer.prompt({
    type: 'input',
    name: 'branchName',
    message: `${messagePrefix} ${utils.t('title.inputNewBranchName')}`,
    validate (input) {
      return Boolean(input)
    }
  })

  const base = utils.baseOnBranch(branchType, configs)
  const baseProtected = Boolean(configs.branches['long-lived'][base].protected)
  const name = `${branchType}${configs.branches.infix}${branchName}`

  if (await status.hasLocalBranch(name)) {
    throw new Error(
      utils.t('status.branchExist', {
        branchName: name
      })
    )
  }

  await newBranchHelper({
    base,
    baseProtected,
    name,
    statusCheck
  })

  const { push } = await inquirer.prompt({
    type: 'confirm',
    name: 'push',
    message: `${await utils.promptPrefix()} ${utils.t('title.pushToRemote')}`,
    default: true
  })

  if (push) {
    await exec(`git push --set-upstream origin ${name}`)
  }
}
