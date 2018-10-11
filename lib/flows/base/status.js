module.exports = async ({ git, log }) => {
  if (await git.status.changes()) {
    await git.status.show()
  } else {
    log('Working tree clean')
  }

  const unpushed = await git.status.unpushed()

  if (unpushed) {
    log(`\nunpushed commits (${unpushed.length}):`)
    log(`${unpushed.join('\n')}\n`)
  }
}
