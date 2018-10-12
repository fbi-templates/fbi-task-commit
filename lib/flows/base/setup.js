module.exports = async ({ git, io, helper, configs, assign }) => {
  const { flowName } = await io.prompt({
    type: 'list',
    name: 'flowName',
    message: `Choose a flow`,
    choices: Object.keys(configs.flows)
  })

  if (!flowName) {
    return
  }

  const flowConfig = configs.flows[flowName]
  const remotes = await git.branch.remotes()
  const locals = await git.branch.locals()
  const needed = Object.keys(flowConfig.branches['long-lived'])

  const needRemote = needed.filter(n => !remotes.includes(n))
  const needLocal = needed.filter(n => !locals.includes(n))

  if (needLocal.length > 0) {
    for (let branch of needLocal) {
      const from = flowConfig.branches['long-lived'][branch].baseOn
      await git.branch.add(branch, from)
      if (needRemote.includes(branch)) {
        await git.push(`--set-upstream origin ${branch}`)
      }
    }
  }

  configs['flow'] = flowName
  configs['branches'] = flowConfig.branches
  configs['actions'] = flowConfig.actions

  await git.checkout(flowConfig.branches.main || 'master')

  if (await helper.pkg.exist()) {
    const pkgCnt = await helper.pkg.read()
    const newCnt = assign({}, pkgCnt, {
      fbi: {
        commit: {
          flow: flowName
        }
      }
    })

    await helper.pkg.write(newCnt)
    await git.add(['package.json'])
    await git.commit(['package.json'], 'chore(fbi):setup-commit-flow')
    await git.push()
  }
}
