const newBranchHelper = require('./helpers/new-branch')

module.exports = async ({ configs, helper, io, git, statusCheck }) => {
  const { branchType } = await io.prompt({
    type: 'list',
    name: 'branchType',
    message: `${await helper.promptPrefix()} ${helper.t('title.chooseBranchType')}`,
    choices: Object.keys(configs.branches['short-lived'])
  })

  const base = helper.baseOnBranch(branchType, configs)
  await git.checkout(base).catch(statusCheck)

  const { branchName } = await io.prompt({
    type: 'input',
    name: 'branchName',
    message: `${await helper.promptPrefix()} ${helper.t('title.inputNewBranchName')}:`,
    validate (input) {
      return Boolean(input)
    }
  })

  const baseProtected = Boolean(configs.branches['long-lived'][base].protected)
  const name = `${branchType}${configs.branches.infix}${branchName}`
  const localBranches = await git.branch.locals()
  if (localBranches.includes(name)) {
    throw new Error(
      helper.t('status.branchExist', {
        branchName: name
      })
    )
  }

  await newBranchHelper({
    base,
    baseProtected,
    name,
    git,
    statusCheck
  })

  const { push } = await io.prompt({
    type: 'confirm',
    name: 'push',
    message: `${await helper.promptPrefix()} ${helper.t('title.pushToRemote')}`,
    default: true
  })

  if (push) {
    await git.push(`--set-upstream origin ${name}`)
  }
}
