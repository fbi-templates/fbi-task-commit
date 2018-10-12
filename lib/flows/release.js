module.exports = async ({ configs, helper, git, log, style, statusCheck }) => {
  const longLived = configs.branches['long-lived']
  const shortLived = configs.branches['short-lived']
  const ignore = Object.keys(longLived).filter(b => longLived[b].protected)
  const current = await git.branch.current()
  const target = await helper.chooseBranch(current, ignore, 'release')

  if (!target) {
    log(style.red(`You have no branch to release`))
    return
  }

  const branchType = shortLived[target.split(configs.branches.infix)[0]]
  const base = branchType ? branchType['baseOn'] : null

  if (base && current !== base) {
    await git.checkout(base).catch(statusCheck)
  }
  await git.fetch('--all --prune')

  if (base) {
    const baseProtected = Boolean(longLived[base].protected)
    if (baseProtected) {
      await git.resetHard(`origin/${base}`)
    } else {
      await git.merge(`origin/${base}`, '--ff').catch(statusCheck)
    }
  }

  if ((await git.branch.current()) !== target) {
    await git.checkout(target).catch(statusCheck)
  }

  const remoteBranches = await git.branch.remotes()
  if (
    remoteBranches.includes(target) &&
    (await git.branch.needMerge(target, `origin/${target}`))
  ) {
    await git.exec(`rebase -i origin/${target}`).catch(statusCheck)
  }

  if (base) {
    await git.checkout(base).catch(statusCheck)
    await git.merge(target, '--no-ff').catch(statusCheck)
  }

  const nextValidVersion = await helper.nextValidVersion(
    configs['standard-version']
  )
  if (nextValidVersion) {
    await helper.bumpVersion(configs['standard-version'], nextValidVersion)
  }

  await git.push('--follow-tags')

  // del
  console.log(await git.branch.current(), target)
  if ((await git.branch.current()) === target) {
    await git.checkout(base || configs.branches.main)
  }
  await git.branch.del(target, 1).catch(null)
  await git.branch.delRemote(target)
}
