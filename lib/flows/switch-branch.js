module.exports = async ({
  configs,
  status,
  utils,
  inquirer,
  exec,
  statusCheck
}) => {
  const messagePrefix = await utils.promptPrefix()

  const { branch } = await inquirer.prompt({
    type: 'list',
    name: 'branch',
    message: `${messagePrefix} ${utils.t('title.chooseBranchType')}`,
    choices: await status.localBranches(),
    pageSize: 50
  })

  await exec('git stash -u')
  await exec(`git checkout ${branch}`).catch(statusCheck)

  if (await status.hasStashs()) {
    await exec('git stash pop')
  }
}
