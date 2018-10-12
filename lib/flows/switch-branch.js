module.exports = async ({ helper, io, git, log, style, statusCheck }) => {
  const choices = await git.branch.locals()

  if (!choices || choices.length === 1) {
    log(style.red(`You have no branch to switch`))
    return
  }

  const messagePrefix = await helper.promptPrefix()
  const { branch } = await io.prompt({
    type: 'list',
    name: 'branch',
    message: `${messagePrefix} ${helper.t('title.chooseBranch')}`,
    choices,
    pageSize: 50
  })

  await git.checkout(branch).catch(statusCheck)
}
