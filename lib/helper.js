const io = require('inquirer')
const semver = require('semver')
const standardVersion = require('@peak-stone/standard-version')
const git = require('./utils/git')

const style = ctx.utils.style
const log = console.log

async function promptPrefix(name) {
  return `[${style.magenta(name || (await git.branch.current()))}]`
}

async function gitInit() {
  const {
    init
  } = await io.prompt({
    type: 'confirm',
    name: 'init',
    message: 'This is not a git repository. "git init" now ?',
    default: false
  })

  if (init) {
    return git.init()
  } else {
    process.exit(0)
  }
}

async function rmStaleBranches() {
  const staleBranches = await git.branch.stales()
  if (staleBranches && staleBranches.length > 0) {
    for (let branch of staleBranches) {
      await git.branch.del(branch, 1)
    }
    log(`stale branches ${staleBranches.join(', ')} removed`)
  } else {
    log('no stale branch')
  }
}

async function chooseBranch(currentBranch, ignore, action) {
  let branches = await git.branch.locals()
  branches = branches.filter(b => !ignore.includes(b))

  if (branches.length <= 0) {
    // log(style.red(`\n You have no branch to ${action}`))
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
  const {
    targetBranch
  } = await io.prompt({
    type: 'list',
    name: 'targetBranch',
    message: `${await promptPrefix()} ${this.t('title.chooseBranch', {
      action: this.t(`actions.${action}`)
    })}`,
    choices,
    pageSize: 50
  })

  return targetBranch
}

async function bumpVersion(opts, target, current) {
  // if (!opts.dryRun) {
  //   const answer = await io.prompt({
  //     type: 'confirm',
  //     name: 'bump',
  //     message: `${await promptPrefix()} Bump the version`,
  //     default: true
  //   })

  //   if (!answer.bump) {
  //     return
  //   }
  // }

  try {
    const oldVersion =
      current || (await git.tag.latest()).replace(opts.tagPrefix, '')
    opts['current'] = oldVersion
    if (target) {
      opts['target'] = target
    }
    const newVersion = await standardVersion(opts)
    log({
      newVersion,
      oldVersion
    })
    return {
      newVersion,
      oldVersion
    }
  } catch (err) {
    log(style.red(`standard-version failed with message: ${err.message}`))
  }
}

async function nextValidVersion(opts, ver) {
  const _opts = JSON.parse(JSON.stringify(opts))

  const {
    newVersion,
    oldVersion
  } = await bumpVersion({
      ..._opts,
      ...{
        dryRun: true
      }
    },
    null,
    ver
  )

  const tags = await git.tag.list()
  const nextTag = `${_opts.tagPrefix}${newVersion}`
  if (tags.includes(nextTag)) {
    const {
      newVer
    } = await io.prompt({
      type: 'input',
      name: 'newVer',
      message: `Tag '${nextTag}' already exists, input another version`,
      validate(value) {
        if (!semver.valid(value)) {
          return 'Input version is not valid'
        } else if (tags.includes(`${_opts.tagPrefix}${value}`)) {
          return `Tag '${_opts.tagPrefix}${value}' already exists`
        }
        return true
      }
    })

    return newVer
  }
  return oldVersion
}

async function canCommit(configs) {
  const hasChange = await git.status.changes()
  if (!hasChange) {
    log(this.t('status.noCommit'))
    return false
  }

  const current = await git.branch.current()
  if (configs.branches.protected.includes(current)) {
    log(
      style.yellow(
        `Current branch is being protected, cannot commit manually\nYou must reset it by doing 'git reset --hard origin/master'`
      )
    )
    return false
  }

  return true
}

function _base(branch, configs, type) {
  const branchType =
    configs.branches['short-lived'][branch.split(configs.branches.infix)[0]]
  return branchType ? branchType[type] : configs.branches.main
}

function baseOnBranch(branch, configs) {
  return _base(branch, configs, 'baseOn')
}

function mergeToBranch(branch, configs) {
  return _base(branch, configs, 'mergeTo')
}

async function _fixConflictsQuestion(currBranch) {
  log()
  return io.prompt({
    type: 'confirm',
    name: 'resolved',
    message: `${await promptPrefix(currBranch)} If conflicts have been resolved, proceed to the next step`,
    default: true
  })
}

async function checkStatusConflicts(currBranch, configs) {
  // if (!await status.hasRemoteBranch(currBranch)) {
  //   // Current branch have already been removed from the remote repository, remove it now ?
  //   const { remove } = await io.prompt({
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
  //     log(`Branch '${currBranch}' removed.`)
  //     return
  //   }
  // }

  const conflictsStatus = await git.status.conflicts()
  // log('status conflicts:', conflicts)
  if (conflictsStatus) {
    log('conflicts found:')
    log(style.red(conflictsStatus.map(c => `            ${c}`).join('\n')))
    const {
      resolved
    } = await _fixConflictsQuestion(currBranch)
    // log('resolved:', resolved)

    if (resolved) {
      if (configs.flow.checkConflictString) {
        await checkConflictString(currBranch)
      }
      return 'commit'
    } else {
      return false
    }
  } else {
    if (configs.flow.checkConflictString) {
      await checkConflictString(currBranch)
    }
  }
}

async function checkConflictString(currBranch) {
  const conflictStr = await git.status.conflictStrings()
  if (conflictStr) {
    log('conflicts string found:')
    log(style.red(conflictStr.map(c => `            ${c}`).join('\n')))
    const {
      resolved
    } = await _fixConflictsQuestion(currBranch)
    if (resolved) {
      await checkConflictString(currBranch)
    } else {
      return false
    }
  }
}

async function checkStatus(configs) {
  if (await git.status.isRebasing()) {
    return 'rebase'
  } else {
    const currBranch = await git.branch.current()
    return checkStatusConflicts(currBranch, configs)
    // return ''
  }
}

async function noUpstreamAndSet(target) {
  const {
    push
  } = await io.prompt({
    type: 'confirm',
    name: 'push',
    message: `${await promptPrefix()} ${this.t('status.noUpstream')}, ${this.t('title.setUpStream')} ?`,
    default: true
  })

  if (push) {
    await git.push(
      `--set-upstream origin ${target || (await git.branch.current())}`
    )
  }
}

module.exports = {
  gitInit,
  rmStaleBranches,
  chooseBranch,
  promptPrefix,
  bumpVersion,
  nextValidVersion,
  canCommit,
  baseOnBranch,
  mergeToBranch,
  checkStatus,
  checkConflictString,
  noUpstreamAndSet,
  pkg: require('./utils/pkg')
}
