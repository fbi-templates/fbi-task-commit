const inquirer = require('inquirer')
const exec = require('./exec')
const status = require('./status')
const utils = require('./utils')

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

async function chooseBranch (currentBranch, configs, action) {
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
    message: `${await utils.promptPrefix()} Choose a branch ${action ? 'to ' + action : ''}`,
    choices
  })

  return targetBranch
}

module.exports = {
  gitInit,
  cleanUp,
  rmStaleBranches,
  chooseBranch
}
