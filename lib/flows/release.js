module.exports = async ({
  configs,
  status,
  utils,
  chalk,
  exec,
  statusCheck
}) => {
  const current = await status.currentBranch()
  const ignore = Object.keys(configs.branches['long-lived']).filter(
    b => !configs.branches['long-lived'][b].protected
  )
  const target = await utils.chooseBranch(current, ignore, 'release')

  if (!target) {
    return
  }

  const base =
    configs.branches['short-lived'][target.split(configs.branches.infix)[0]][
      'baseOn'
    ]

  if (current !== base) {
    await exec(`git checkout ${base}`).catch(statusCheck)
  }
  await exec('git fetch --all --prune')

  const baseProtected = Boolean(configs.branches['long-lived'][base].protected)
  if (baseProtected) {
    await exec(`git reset --hard origin/${base}`)
  } else {
    await exec(`git merge --ff origin/${base}`).catch(statusCheck)
  }

  await exec(`git checkout ${target}`).catch(statusCheck)
  if (
    (await status.hasRemoteBranch(target)) &&
    (await status.needMerge(target, `origin/${target}`))
  ) {
    await exec(`git rebase -i origin/${target}`).catch(statusCheck)
  }
  // await exec(`git rebase -i origin/${target}`).catch(statusCheck)

  await exec(`git checkout ${base}`).catch(statusCheck)
  await exec(`git merge --no-ff ${target}`).catch(statusCheck)

  const nextValidVersion = await utils.nextValidVersion(
    configs['standard-version']
  )
  if (nextValidVersion) {
    await utils.bumpVersion(configs['standard-version'], nextValidVersion)
  }

  await exec('git push --follow-tags')

  await exec(`git branch -D ${target}`)
  await exec(`git push origin --delete ${target}`)
}
