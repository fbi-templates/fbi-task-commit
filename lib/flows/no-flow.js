const branches = {
  'long-lived': {
    master: {}
  },
  'short-lived': {
    feature: {
      from: 'master',
      rebase: 'master'
    },
    hotfix: {
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
    const basebranch = branches['short-lived'][branchType]['from']

    await exec('git stash -u')
    await exec(`git checkout ${basebranch}`)
    await exec('git fetch --prune')
    await exec(`git reset --hard origin/${basebranch}`)
    await exec(`git checkout -b ${fullName} ${basebranch}`)

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
    const currentBranch = await status.currentBranch()
    const targetBranch = await utils.chooseBranch(
      currentBranch,
      Object.keys(branches['long-lived']),
      'sync'
    )

    if (!targetBranch) {
      return
    }

    const rebaseTarget =
      branches['short-lived'][currentBranch.split(branches.infix)[0]]['rebase']

    await exec('git stash -u')
    if (targetBranch !== currentBranch) {
      await exec(`git checkout ${targetBranch}`).catch(statusCheck)
    }

    await exec('git pull --rebase').catch(statusCheck)

    if (rebaseTarget) {
      await exec(`git pull origin ${rebaseTarget} --rebase`).catch(statusCheck)
    }

    if (await status.upstreamValid(targetBranch)) {
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
        await exec(`git push --set-upstream origin ${targetBranch}`)
      }
    }

    if (await status.hasStashs()) {
      await exec('git stash pop')
    }
  }
}
