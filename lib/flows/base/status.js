module.exports = async ({ git, log, helper }) => {
  if (await git.status.changes()) {
    await git.status.show()
  } else {
    log('Working tree clean')
  }

  const unpushed = await git.status.unpushed().catch(async err => {
    if (err.includes('Could not find a tracked remote branch')) {
      await helper.noUpstreamAndSet()
    }
  })

  if (unpushed) {
    log(`\nunpushed commits (${unpushed.length}):`)
    log(`${unpushed.join('\n')}\n`)
  }
}
