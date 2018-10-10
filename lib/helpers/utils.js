const chalk = require('chalk')
const inquirer = require('inquirer')
const standardVersion = require('@peak-stone/standard-version')
const status = require('./status')
const exec = require('./exec')

async function promptPrefix (name) {
  return `[${chalk.magenta(name || (await status.currentBranch({
    quiet: true
  })))}]`
}

async function gitInit () {
  const { init } = await inquirer.prompt({
    type: 'confirm',
    name: 'init',
    message: 'This is not a git repository. "git init" now ?',
    default: false
  })

  if (init) {
    return exec('git init')
  } else {
    process.exit(0)
  }
}

function cleanUp () {
  return exec('git gc')
}

async function rmStaleBranches () {
  const staleBranches = await status.staleBranches()
  if (staleBranches && staleBranches.length > 0) {
    for (let branch of staleBranches) {
      await exec(`git branch -D ${branch}`)
    }
    console.log(`stale branches ${staleBranches.join(', ')} removed`)
  } else {
    console.log('no stale branch')
  }
}

async function chooseBranch (currentBranch, ignore, action) {
  let branches = await status.localBranches()
  branches = branches.filter(b => !ignore.includes(b))

  if (branches.length <= 0) {
    console.log(chalk.red(`\n You have no branch to ${action}`))
    return null
  }

  let choices = []

  for (let b of branches) {
    if (b === currentBranch) {
      choices.unshift({
        name: `${b} (${this.t('status.currentBranch')})`,
        short: b,
        value: b
      })
    } else {
      choices.push({
        name: b,
        value: b
      })
    }
  }
  const { targetBranch } = await inquirer.prompt({
    type: 'list',
    name: 'targetBranch',
    message: `${await promptPrefix()} ${this.t('title.chooseBranch', {
      action: this.t('actions.sync')
    })}`,
    choices,
    pageSize: 50
  })

  return targetBranch
}

async function bumpVersion (configs) {
  const answer = await inquirer.prompt({
    type: 'confirm',
    name: 'bump',
    message: `${await promptPrefix()} Bump the version`,
    default: true
  })

  if (!answer.bump) {
    return
  }

  try {
    const opts = configs['standard-version']
    const latestTag = await status.latestTag()
    const latestVersion = latestTag.replace(opts.tagPrefix, '')
    opts['current'] = latestVersion
    const newVersion = await standardVersion(opts)
    console.log('newVersion:', newVersion)
  } catch (err) {
    console.error(
      chalk.red(`standard-version failed with message: ${err.message}`)
    )
  }
}

async function canCommit (configs) {
  const hasChange = await status.changes()
  if (!hasChange) {
    console.log(this.t('status.noCommit'))
    return false
  }

  const current = await status.currentBranch()
  if (configs.branches.protected.includes(current)) {
    console.log(
      chalk.yellow(`Current branch is being protected, cannot commit manually`)
    )
    return false
  }

  return true
}

function _base (branch, configs, type) {
  const branchType =
    configs.branches['short-lived'][branch.split(configs.branches.infix)[0]]
  return branchType ? branchType[type] : configs.branches.main
}

function baseOnBranch (branch, configs) {
  return _base(branch, configs, 'baseOn')
}

function mergeToBranch (branch, configs) {
  return _base(branch, configs, 'mergeTo')
}

async function _fixConflictsQuestion (currBranch) {
  console.log()
  return inquirer.prompt({
    type: 'confirm',
    name: 'resolved',
    message: `[${await utils.promptPrefix(currBranch)}] If conflicts have been resolved, proceed to the next step`,
    default: true
  })
}

async function check (configs) {
  if (await status.isRebasing()) {
    return 'rebase'
  } else {
    const currBranch = await status.currentBranch()
    await checkStatus(currBranch, configs)
    return ''
  }
}

async function checkStatus (currBranch, configs) {
  // if (!await status.hasRemoteBranch(currBranch)) {
  //   // Current branch have already been removed from the remote repository, remove it now ?
  //   const { remove } = await inquirer.prompt({
  //     type: 'confirm',
  //     name: 'remove',
  //     message: `${await promptPrefix(currBranch)} Current branch have already been removed from the remote repository, remove it now ?`,
  //     default: true
  //   })

  //   if (remove) {
  //     await exec(`git checkout ${configs.flow.branch.base}`, {
  //       ignoreStderr: true
  //     })
  //     await exec(`git branch -D ${currBranch}`)
  //     console.log(`Branch '${currBranch}' removed.`)
  //     return
  //   }
  // }

  const conflictsStatus = await status.conflicts()
  // console.log('status conflicts:', conflicts)
  if (conflictsStatus) {
    console.log('conflicts found:')
    console.log(chalk.red(conflictsStatus.map(c => `  ${c}`).join('\n')))
    const { resolved } = await _fixConflictsQuestion(currBranch)
    // console.log('resolved:', resolved)

    if (resolved) {
      if (configs.flow.checkConflictString) {
        await checkString(currBranch)
      }
    } else {
      process.exit(0)
    }
  } else {
    if (configs.flow.checkConflictString) {
      await checkString(currBranch)
    }
  }
}

async function checkString (currBranch) {
  const conflictStr = await status.conflictsString()
  if (conflictStr) {
    console.log('conflicts string found:')
    console.log(chalk.red(conflictStr.map(c => `  ${c}`).join('\n')))
    const { resolved } = await _fixConflictsQuestion(currBranch)
    if (resolved) {
      await checkString(currBranch)
    } else {
      process.exit(0)
    }
  }
}

module.exports = {
  gitInit,
  cleanUp,
  rmStaleBranches,
  chooseBranch,
  promptPrefix,
  bumpVersion,
  canCommit,
  baseOnBranch,
  mergeToBranch,
  check,
  checkStatus,
  checkString
}
