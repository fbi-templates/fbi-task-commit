module.exports = async ({ helper, io, statusCheck }) => {
  const messagePrefix = await helper.promptPrefix()

  const { branch } = await io.prompt({
    type: 'list',
    name: 'branch',
    message: `${messagePrefix} ${helper.t('title.chooseBranchType')}`,
    choices: await git.branch.locals(),
    pageSize: 50
  })

  await git.checkout(branch).catch(statusCheck)
}
