async function rebase (status, exec, inquirer, chalk) {
  const conflicts = await status.conflicts()
  if (conflicts) {
    console.log(chalk.bold('rebase in progress, conflicts:'))
    console.log(chalk.red(conflicts.map(c => `  ${c}`).join('\n')))
  } else {
    console.log(chalk.bold('rebase in progress, no conflicts'))
  }

  console.log()
  const { next } = await inquirer.prompt({
    type: 'list',
    name: 'next',
    message: 'fix conflicts and then run:',
    choices: ['continue', 'skip', 'abort']
  })

  if (next === 'continue') {
    // check string
    const files = await status.conflictfiles()
    await utils.checkString()

    let paths = conflicts ? conflicts.join(' ') : ''
    paths = paths + ' ' + (files ? files.join(' ') : '')
    if (paths) {
      await exec(`git add ${paths}`)
    }
  }
  await exec(`git rebase --${next}`).catch(async err => {
    if (await status.isRebasing()) {
      await rebase(status, exec, inquirer, chalk)
    }
  })

  if (await status.isRebasing()) {
    await rebase(status, exec, inquirer, chalk)
  }
}

module.exports = async ({ status, chalk, inquirer, exec }) => {
  if (await status.isRebasing()) {
    await rebase(status, exec, inquirer, chalk)
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
