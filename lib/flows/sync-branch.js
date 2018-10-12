module.exports = async ({ configs, helper, io, git, statusCheck }) => {
  const current = await git.branch.current()
  const target = await helper.chooseBranch(
    current,
    Object.keys(configs.branches['long-lived']),
    'sync'
  )

  const upstream = await git.branch.upstream()

  if (!target) {
    // sync current branch
    upstream && (await git.exec(`rebase origin/${current}`).catch(statusCheck))
    return
  }

  const base = helper.mergeToBranch(target, configs)

  if (target !== current) {
    await git.checkout(target).catch(statusCheck)
  }

  // merge
  if (upstream && (await git.branch.needMerge(target, `origin/${target}`))) {
    await git.exec(`rebase origin/${target}`).catch(statusCheck)
  }

  if (base && (await git.branch.needMerge(target, `origin/${base}`))) {
    await git.exec(`rebase origin/${base}`).catch(statusCheck)
  }

  const remoteBranches = await git.branch.remotes()
  if (remoteBranches.includes(target)) {
    if (await git.status.unpushed()) {
      // await git.push('--force')
      await git.push()
    } else {
      console.log(helper.t('status.noUnpushed'))
    }
  } else {
    console.log()

    await helper.noUpstreamAndSet(target)
  }
}
