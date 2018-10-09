const chalk = require('chalk')
const inquirer = require('inquirer')
const exec = require('./exec')
const status = require('./status')
const utils = require('./utils')

async function question (currentBranch) {
  console.log()
  return inquirer.prompt({
    type: 'confirm',
    name: 'resolved',
    message: `[${await utils.promptPrefix(currentBranch)}] If conflicts have been resolved, proceed to the next step`,
    default: true
  })
}

async function checkStatus (currentBranch, configs) {
  const upstreamGone = await status.upstreamGone(currentBranch)
  if (upstreamGone) {
    // Current branch have already been removed from the remote repository, remove it now ?
    const { remove } = await inquirer.prompt({
      type: 'confirm',
      name: 'remove',
      message: `[${await utils.promptPrefix(currentBranch)}] Current branch have already been removed from the remote repository, remove it now ?`,
      default: true
    })

    if (remove) {
      await exec(`git checkout ${configs.flow.branch.base}`, {
        ignoreStderr: true
      })
      await exec(`git branch -D ${currentBranch}`)
      console.log(`Branch '${currentBranch}' removed.`)
      return
    }
  }

  const conflicts = await status.conflicts()
  // console.log('status conflicts:', conflicts)
  if (conflicts) {
    console.log('conflicts found:')
    console.log(chalk.red(conflicts.map(c => `  ${c}`).join('\n')))
    const { resolved } = await question(currentBranch)
    // console.log('resolved:', resolved)

    if (resolved) {
      if (configs.checkConflictString) {
        await checkString(currentBranch)
      }
    } else {
      process.exit(0)
    }
  } else {
    if (configs.checkConflictString) {
      await checkString(currentBranch)
    }
  }
}

async function checkString (currentBranch) {
  const conflicts = await status.conflictsString()
  if (conflicts) {
    console.log('conflicts string found:')
    console.log(chalk.red(conflicts.map(c => `  ${c}`).join('\n')))
    const { resolved } = await question(currentBranch)
    if (resolved) {
      await checkString(currentBranch)
    } else {
      process.exit(0)
    }
  }
}

async function check ({ configs }) {
  if (await status.isRebasing()) {
    return 'rebase'
  } else {
    const currentBranch = await status.currentBranch()
    await checkStatus(currentBranch, configs)
    return ''
  }
}

exports.check = check
exports.checkStatus = checkStatus
exports.checkString = checkString
