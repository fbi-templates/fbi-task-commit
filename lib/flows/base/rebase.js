async function rebase ({ status, chalk, inquirer, exec, utils }) {
  const conflicts = await status.conflicts()
  if (conflicts) {
    console.log(
      chalk.bold(`${await utils.promptPrefix()} Rebase in progress, conflicts:`)
    )
    console.log(chalk.red(conflicts.map(c => `  ${c}`).join('\n')))
  } else {
    console.log(chalk.bold('rebase in progress, no conflicts'))
  }

  console.log()
  const { next } = await inquirer.prompt({
    type: 'list',
    name: 'next',
    message: `${await utils.promptPrefix()} Fix conflicts and then run:`,
    choices: ['continue', 'skip', 'abort']
  })

  if (next === 'continue') {
    // check string
    const files = await status.conflictfiles()
    await utils.checkConflictString()

    let paths = conflicts ? conflicts.join(' ') : ''
    paths = paths + ' ' + (files ? files.join(' ') : '')
    if (paths.trim()) {
      await exec(`git add ${paths}`)
    }
  }
  await exec(`git rebase --${next}`).catch(async err => {
    if (await status.isRebasing()) {
      await rebase({
        status,
        chalk,
        inquirer,
        exec,
        utils
      })
    }
  })

  if (await status.isRebasing()) {
    await rebase({
      status,
      chalk,
      inquirer,
      exec,
      utils
    })
  }
}

module.exports = async ({ status, chalk, inquirer, exec, utils }) => {
  if (await status.isRebasing()) {
    await rebase({
      status,
      chalk,
      inquirer,
      exec,
      utils
    })
  } else {
    const conflicts = await status.conflictsString()
    if (conflicts) {
      console.log(chalk.bold(`Forgot to resolve conflicts?`))
      console.log(chalk.red(conflicts.map(c => `  ${c}`).join('\n')))

      console.log()
      const { next } = await inquirer.prompt({
        type: 'list',
        name: 'next',
        message: 'choose an action:',
        choices: [
          'ignore',
          {
            name: 'I have resolved, ready to commit',
            value: 'commit',
            short: 'commit'
          }
        ]
      })

      // flow: commit
      return next
    }
  }

  return ''
}
