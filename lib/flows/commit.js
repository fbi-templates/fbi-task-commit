const chalk = require('chalk')
const inquirer = require('inquirer')
const { bootstrap } = require('@peak-stone/commitizen-promise/dist/cli/git-cz')
const status = require('../helpers/status')
const exec = require('../helpers/exec')

function czCommit () {
  return bootstrap({
    cliPath: '@peak-stone/commitizen-promise',
    config: {
      path: '@peak-stone/cz-fbi'
    }
  })
}

function makeChoices (changes, utils) {
  let choices = []
  if (changes.untracked) {
    choices.push(new inquirer.Separator('untracked:'))
    choices = choices.concat(
      changes.untracked.map(i => ({
        name: i,
        value: `add ${i}`
      }))
    )
  }
  if (changes.modified) {
    choices.push(new inquirer.Separator('modified:'))
    choices = choices.concat(
      changes.modified.map(i => ({
        name: i,
        value: `add ${i}`
      }))
    )
  }
  if (changes.deleted) {
    choices.push(new inquirer.Separator('deleted:'))
    choices = choices.concat(
      changes.deleted.map(i => ({
        name: i,
        value: `rm ${i}`
      }))
    )
  }
  if (changes.conflicts) {
    choices.push(new inquirer.Separator('conflicts:'))
    choices = choices.concat(
      changes.conflicts.map(i => ({
        name: i,
        value: `add ${i}`
      }))
    )
  }

  if (changes.staged) {
    console.log(`\n${utils.t('status.Alredy staged')}:`)
    console.log(`  ${chalk.green(changes.staged.join('\n  '))}\n`)
  }

  return choices
}

module.exports = async ({ utils }) => {
  const changes = await status.getStatus(utils)
  const choices = makeChoices(changes, utils)
  // console.log('changes:', changes)

  if (
    changes.staged &&
    !changes.conflicts &&
    !changes.deleted &&
    !changes.untracked &&
    !changes.modified &&
    !changes.conflicts
  ) {
    await czCommit()
  }

  if (choices.length > 0) {
    console.log()
    const { paths } = await inquirer.prompt({
      type: 'checkbox',
      name: 'paths',
      message: `${await utils.promptPrefix()} ${utils.t('title.selectForStaged')}:`,
      choices,
      pageSize: 50
    })

    console.log('paths:', paths)

    if (paths && paths.length > 0) {
      const pathsToAdd = []
      const pathsToDel = []

      paths.map(p => {
        if (p.startsWith('add ')) {
          pathsToAdd.push(p.replace('add ', ''))
        } else if (p.startsWith('rm ')) {
          pathsToDel.push(p.replace('rm ', ''))
        }
      })

      // console.log('pathsToAdd:', pathsToAdd)
      // console.log('pathsToDel:', pathsToDel)

      if (pathsToAdd.length > 0 || pathsToDel.length > 0) {
        if (pathsToAdd.length > 0) {
          await exec(`git add ${pathsToAdd.join(' ')}`)
        }
        if (pathsToDel.length > 0) {
          await exec(`git rm ${pathsToDel.join(' ')}`)
        }

        const changes = await status.changes()
        if (changes && changes.length > 0) {
          await czCommit()
        } else {
          console.log(`${utils.t('status.noCommit')}`)
        }
      }
    } else {
      console.log(`${utils.t('status.noCommit')}`)
    }
  } else {
    console.log(`${utils.t('status.noCommit')}`)
  }
}
