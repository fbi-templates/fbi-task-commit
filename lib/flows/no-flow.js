const branches = {
  'long-lived': {
    master: {}
  },
  'short-lived': {
    feature: {
      from: 'master',
      rebase: 'master'
    },
    bugfix: {
      from: 'master',
      rebase: 'master'
    }
  },
  infix: '/'
}

module.exports = {
  // new branch
  async 'new branch' ({ status, utils, inquirer, exec }) {
    const messagePrefix = await utils.promptPrefix()

    const { branchType } = await inquirer.prompt({
      type: 'list',
      name: 'branchType',
      message: `${messagePrefix} ${utils.t('title.chooseBranchType')}`,
      choices: Object.keys(branches['short-lived'])
    })

    const { branchName } = await inquirer.prompt({
      type: 'input',
      name: 'branchName',
      message: `${messagePrefix} ${utils.t('title.inputNewBranchName')}`,
      validate (input) {
        return Boolean(input)
      }
    })

    const fullName = `${branchType}${branches.infix}${branchName}`
    const base = branches['short-lived'][branchType]['from']

    await exec('git stash -u')
    await exec(`git checkout ${base}`)
    await exec('git fetch -all --prune')
    await exec(`git reset --hard origin/${base}`)
    await exec(`git checkout -b ${fullName} ${base}`)

    const { push } = await inquirer.prompt({
      type: 'confirm',
      name: 'push',
      message: `${await utils.promptPrefix()} ${utils.t('title.pushToRemote')}`,
      default: true
    })

    if (push) {
      await exec(`git push --set-upstream origin ${fullName}`)
    }

    if (await status.hasStashs()) {
      await exec('git stash pop')
    }
  },
  // sync branch
  async 'sync branch' ({ status, utils, inquirer, exec, statusCheck }) {
    const current = await status.currentBranch()
    const target = await utils.chooseBranch(
      current,
      Object.keys(branches['long-lived']),
      'sync'
    )

    if (!target) {
      return
    }

    const base =
      branches['short-lived'][target.split(branches.infix)[0]]['rebase']

    await exec('git stash -u')
    if (target !== current) {
      await exec(`git checkout ${target}`).catch(statusCheck)
    }

    await exec('git pull --rebase').catch(statusCheck)

    if (base) {
      await exec(`git pull origin ${base} --rebase`).catch(statusCheck)
    }

    if (await status.upstreamValid(target)) {
      if (await status.unpushed(utils)) {
        await exec('git push')
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
  },
  async release ({ status, utils, inquirer, exec, statusCheck }) {
    const current = await status.currentBranch()
    const ignore = Object.keys(branches['long-lived']).filter(
      b => !branches['long-lived'][b].protected
    )
    const target = await utils.chooseBranch(current, ignore, 'release')

    if (!target) {
      return
    }

    const base =
      branches['short-lived'][target.split(branches.infix)[0]]['from']

    if (current !== base) {
      await exec(`git checkout ${base}`).catch(statusCheck)
    }
    await exec('git fetch -all --prune')

    const baseProtected = Boolean(branches['long-lived'][base].protected)
    if (baseProtected) {
      await exec(`git reset --hard origin/${base}`)
    }

    await exec(`git checkout ${target}`).catch(statusCheck)
    await exec(`git rebase -i origin/${target}`).catch(statusCheck)

    await exec(`git checkout ${base}`).catch(statusCheck)
    await exec(`git merge --no-ff ${target}`).catch(statusCheck)

    await utils.bumpVersion(configs)

    await exec('git push --follow-tags')

    await exec(`git branch -D ${releaseBranch}`)
    await exec(`git push origin --delete ${target}`)
  }
}
