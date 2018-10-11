module.exports = async ({ configs, helper, io, exec, statusCheck }) => {
  const current = await git.branch.current()
  const target = await helper.chooseBranch(
    current,
    Object.keys(configs.branches['long-lived']),
    'sync'
  )

  if (!target) {
    return
  }

  const base = helper.mergeToBranch(target, configs)

  if (target !== current) {
    await git.checkout(target).catch(statusCheck)
  }

  // merge
  if (await git.branch.needMerge(target, `origin/${target}`)) {
    await exec(`git rebase origin/${target}`).catch(statusCheck)
  }

  if (base && (await git.branch.needMerge(target, `origin/${base}`))) {
    await exec(`git rebase origin/${base}`).catch(statusCheck)
  }

  const remoteBranches = await git.branch.remotes()
  if (remoteBranches.includes(target)) {
    if (await git.status.unpushed()) {
      // if (await status.needMerge(target, `origin/${target}`)) {
      //   await exec(`git rebase origin/${target}`).catch(statusCheck)
      // }

      await git.push('--force')
    } else {
      console.log(helper.t('status.noUnpushed'))
    }
  } else {
    console.log()

    const { push } = await io.prompt({
      type: 'confirm',
      name: 'push',
      message: `${await helper.promptPrefix()} ${helper.t('status.noUpstream')}, ${helper.t('title.setUpStream')}`,
      default: true
    })

    if (push) {
      await git.push(`--set-upstream origin ${target}`)
    }
  }
}
