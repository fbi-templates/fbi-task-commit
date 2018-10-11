module.exports = async ({ configs, helper, git, exec, statusCheck }) => {
  const current = await git.branch.current()
  const ignore = Object.keys(configs.branches['long-lived']).filter(
    b => !configs.branches['long-lived'][b].protected
  )
  const target = await helper.chooseBranch(current, ignore, 'release')

  if (!target) {
    return
  }

  const base =
    configs.branches['short-lived'][target.split(configs.branches.infix)[0]][
      'baseOn'
    ]

  if (current !== base) {
    await git.checkout(base).catch(statusCheck)
  }
  await git.fetch('--all --prune')

  const baseProtected = Boolean(configs.branches['long-lived'][base].protected)
  if (baseProtected) {
    await git.resetHard(`origin/${base}`)
  } else {
    await git.merge(`origin/${base}`, '--ff').catch(statusCheck)
  }

  await git.checkout(target).catch(statusCheck)

  const remoteBranches = await git.branch.remotes()
  if (
    remoteBranches.includes(target) &&
    (await git.branch.needMerge(target, `origin/${target}`))
  ) {
    await exec(`git rebase -i origin/${target}`).catch(statusCheck)
  }
  // await exec(`git rebase -i origin/${target}`).catch(statusCheck)

  await git.checkout(base).catch(statusCheck)
  await git.merge(target, '--no-ff').catch(statusCheck)

  const nextValidVersion = await helper.nextValidVersion(
    configs['standard-version']
  )
  if (nextValidVersion) {
    await helper.bumpVersion(configs['standard-version'], nextValidVersion)
  }

  await git.push('--follow-tags')

  await git.branch.del(target, 1)
  await git.branch.delRemote(target)
}
