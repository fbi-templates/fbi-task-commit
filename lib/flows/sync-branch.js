const chalk = require('chalk')
const inquirer = require('inquirer')
const exec = require('../helpers/exec')
const status = require('../helpers/status')
const utils = require('../helpers/utils')
const git = require('../helpers/git')

async function chooseBranch (currentBranch, configs) {
  let branches = await status.branches()

  if (configs.flow.name !== 'default') {
    branches = branches.filter(
      b => !Object.values(configs.flow.branch).includes(b)
    )
  }

  if (branches.length <= 0) {
    console.log(chalk.red('\n You have no branch to sync'))
    return null
  }

  let choices = []

  for (let b of branches) {
    if (b === currentBranch) {
      choices.unshift({
        name: `${b} (current branch)`,
        value: b
      })
    } else {
      choices.push({
        name: b,
        value: b
      })
    }
  }

  // const choices = branches.map(
  //   b =>
  //     (b === currentBranch
  //       ? {
  //         name: `${b} (current branch)`,
  //         value: b
  //       }
  //       : {
  //         name: b,
  //         value: b
  //       })
  // )

  const { targetBranch } = await inquirer.prompt({
    type: 'list',
    name: 'targetBranch',
    message: `${await utils.promptPrefix()} Choose a branch to sync`,
    choices
  })

  return targetBranch
}

async function pushToRemote (branch) {
  if (await status.upstreamValid(branch)) {
    if (await status.unpushed()) {
      await exec('git push', {
        ignoreStderr: true
      })
    }
  } else {
    console.log()

    const { push } = await inquirer.prompt({
      type: 'confirm',
      name: 'push',
      message: `${await utils.promptPrefix()} This is a locally only branch, push to remote`,
      default: false
    })

    if (push) {
      await exec(`git push --set-upstream origin ${branch}`, {
        ignoreStderr: true
      })
    }
  }
}

module.exports = async (configs, statusCheck) => {
  const currentBranch = await status.currentBranch()
  // const targetBranch = await chooseBranch(currentBranch, configs)
  const targetBranch = await git.chooseBranch(currentBranch, configs, 'sync')
  // console.log('targetBranch:', targetBranch)

  if (!targetBranch) {
    return
  }

  const rebaseTarget = configs.flow.name === 'default'
    ? null
    : configs.flow.branch.base

  await exec('git stash -u')

  if (targetBranch !== currentBranch) {
    await exec(`git checkout ${targetBranch}`, {
      ignoreStderr: false
    }).catch(err => statusCheck())
  }

  await exec('git pull --rebase').catch(() => statusCheck())

  if (rebaseTarget) {
    await exec(`git pull origin ${rebaseTarget} --rebase`).catch(() =>
      statusCheck()
    )
  }

  await pushToRemote(targetBranch)

  const stashs = await status.stashs()
  if (stashs && stashs.length > 0) {
    await exec('git stash pop')
  }

  return true
}
