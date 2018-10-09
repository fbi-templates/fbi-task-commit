const chalk = require('chalk')
const inquirer = require('inquirer')
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
  let branches = await status.branches()
  branches = branches.filter(b => !ignore.includes(b))

  if (branches.length <= 0) {
    console.log(chalk.red(`\n You have no branch to ${action}`))
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
  const { targetBranch } = await inquirer.prompt({
    type: 'list',
    name: 'targetBranch',
    message: `${await utils.promptPrefix()} Choose a branch ${action ? 'to ' + action : ''}`,
    choices
  })

  return targetBranch
}

module.exports = {
  gitInit,
  cleanUp,
  rmStaleBranches,
  chooseBranch,
  promptPrefix
}
