module.exports = async ({
  configs,
  status,
  utils,
  inquirer,
  exec,
  statusCheck
}) => {
  const current = await status.currentBranch()
  const target = await utils.chooseBranch(
    current,
    Object.keys(configs.branches['long-lived']),
    'sync'
  )

  if (!target) {
    return
  }

  const base = utils.mergeToBranch(target, configs)

  await exec('git stash -u')
  await exec('git fetch --all --prune')

  if (target !== current) {
    await exec(`git checkout ${target}`).catch(statusCheck)
  }

  // merge
  if (await status.needMerge(target, `origin/${target}`)) {
    await exec(`git rebase origin/${target}`).catch(statusCheck)
  }

  if (base && (await status.needMerge(target, `origin/${base}`))) {
    await exec(`git rebase origin/${base}`).catch(statusCheck)
  }

  if (await status.hasRemoteBranch(target)) {
    if (await status.unpushed(utils)) {
      // if (await status.needMerge(target, `origin/${target}`)) {
      //   await exec(`git rebase origin/${target}`).catch(statusCheck)
      // }

      await exec('git push --force')
    } else {
      console.log(utils.t('status.noUnpushed'))
    }
  } else {
    console.log()

    const { push } = await inquirer.prompt({
      type: 'confirm',
      name: 'push',
      message: `${await utils.promptPrefix()} ${utils.t('status.noUpstream')}, ${utils.t('title.setUpStream')}`,
      default: true
    })

    if (push) {
      await exec(`git push --set-upstream origin ${target}`)
    }
  }

  if (await status.hasStashs()) {
    await exec('git stash pop')
  }
}
