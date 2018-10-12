const { bootstrap } = require('@peak-stone/commitizen-promise/dist/cli/git-cz')

function czCommit () {
  return bootstrap({
    cliPath: '@peak-stone/commitizen-promise',
    config: {
      path: '@peak-stone/cz-fbi'
    }
  })
}

function makeChoices (changes, helper, io, log) {
  let choices = []
  if (changes.untracked) {
    choices.push(new io.Separator('untracked:'))
    choices = choices.concat(
      changes.untracked.map(i => ({
        name: i,
        value: `add ${i}`
      }))
    )
  }
  if (changes.modified) {
    choices.push(new io.Separator('modified:'))
    choices = choices.concat(
      changes.modified.map(i => ({
        name: i,
        value: `add ${i}`
      }))
    )
  }
  if (changes.deleted) {
    choices.push(new io.Separator('deleted:'))
    choices = choices.concat(
      changes.deleted.map(i => ({
        name: i,
        value: `rm ${i}`
      }))
    )
  }
  if (changes.conflicts) {
    choices.push(new io.Separator('conflicts:'))
    choices = choices.concat(
      changes.conflicts.map(i => ({
        name: i,
        value: `add ${i}`
      }))
    )
  }

  if (changes.staged) {
    log(`\n${helper.t('status.Alredy staged')}:`)
    log(`  ${ctx.utils.style.green(changes.staged.join('\n  '))}\n`)
  }

  return choices
}

module.exports = async ({ configs, helper, git, io, log }) => {
  if (!await helper.canCommit(configs, log)) {
    return
  }

  const changes = {
    untracked: await git.status.untracked(),
    modified: await git.status.modified(),
    deleted: await git.status.deleted(),
    conflicts: await git.status.conflicts(),
    staged: await git.status.staged(),
    unpushed: await git.status.unpushed()
  }
  const choices = makeChoices(changes, helper, io, log)

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
    log()
    const { paths } = await io.prompt({
      type: 'checkbox',
      name: 'paths',
      message: `${await helper.promptPrefix()} ${helper.t('title.selectForStaged')}:`,
      choices,
      pageSize: 50
    })

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

      // log('pathsToAdd:', pathsToAdd)
      // log('pathsToDel:', pathsToDel)

      if (pathsToAdd.length > 0 || pathsToDel.length > 0) {
        if (pathsToAdd.length > 0) {
          await git.add(pathsToAdd)
        }
        if (pathsToDel.length > 0) {
          await git.del(pathsToDel)
        }

        const changes = await git.status.changes()
        if (changes && changes.length > 0) {
          await czCommit()
        } else {
          log(`${helper.t('status.noCommit')}`)
        }
      }
    } else {
      log(`${helper.t('status.noCommit')}`)
    }
  } else {
    log(`${helper.t('status.noCommit')}`)
  }
}
