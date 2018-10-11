async function rebase (params = { git, style, io, exec, helper, log }) {
  const conflicts = await git.status.conflicts()
  if (conflicts) {
    log(
      style.bold(
        `${await helper.promptPrefix()} Rebase in progress, conflicts:`
      )
    )
    log(style.red(conflicts.map(c => `  ${c}`).join('\n')))
  } else {
    log(style.bold('rebase in progress, no conflicts'))
  }

  log()
  const { next } = await io.prompt({
    type: 'list',
    name: 'next',
    message: `${await helper.promptPrefix()} Fix conflicts and then run:`,
    choices: ['continue', 'skip', 'abort']
  })

  if (next === 'continue') {
    // check string
    const files = await git.status.conflictFiles()
    await helper.checkConflictString()
    const paths = [...(conflicts || []), ...(files || [])]

    if (paths && paths.length > 0) {
      await git.add(conflicts)
    }
  }
  await exec(`git rebase --${next}`).catch(async err => {
    if (await status.isRebasing()) {
      await rebase(params)
    }
  })

  if (await status.isRebasing()) {
    await rebase(params)
  }
}

module.exports = async (
  params = {
    status,
    style,
    io,
    exec,
    helper
  }
) => {
  if (await status.isRebasing()) {
    await rebase(params)
  } else {
    const conflicts = await git.status.conflictStrings()
    if (conflicts) {
      log(style.bold(`Forgot to resolve conflicts?`))
      log(style.red(conflicts.map(c => `  ${c}`).join('\n')))

      log()
      const { next } = await io.prompt({
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
