const inquirer = require('inquirer')
const version = require('./lib/version')
const commit = require('./lib/commit')
const publish = require('./lib/publish')
const {
  isGitRepo,
  getStatus,
  getUnpushedCommits,
  push,
  gitInit
} = require('./lib/git')
const { pkgExist, readPkg } = require('./lib/pkg')

process.on('unhandledRejection', (reason, promise) => {
  ctx.logger.error(
    'Unhandled Rejection at: Promise ',
    promise,
    ' reason: ',
    reason
  )
  throw reason
})

process.on('uncaughtException', async error => {
  ctx.logger.error(error)
  process.exit(0)
})

const defaults = {
  repoPath: process.cwd()
}

async function entry (options = defaults) {
  // prevent additional parameters results in an git git error
  process.argv = process.argv.slice(0, 3)

  if (!(await isGitRepo(options.repoPath))) {
    await gitInit()
  }

  try {
    const hadCommited = await commit(options)
    if (hadCommited) {
      ctx.logger.success('Selected files committed\n')
    }

    // bump version
    await version.bump()

    // push
    const unPushed = await getUnpushedCommits()
    if (unPushed) {
      console.log()
      ctx.logger.info(
        `Unpushed commits(${unPushed.split('\n').filter(u => u).length}):`
      )
      console.log(unPushed)

      const answer = await inquirer.prompt({
        type: 'confirm',
        name: 'pushCommits',
        message: 'Do you want to push now?',
        default: false
      })

      if (answer.pushCommits) {
        await push()
        await push('--tags')
        ctx.logger.success('All commits and tags pushed\n')
      }
    }

    // publish
    if (await pkgExist()) {
      const pkg = readPkg()
      if (!pkg.private) {
        await publish(pkg)
      }
    }

    // status
    await getStatus()
    const unPushed2 = await getUnpushedCommits()
    if (unPushed2) {
      console.log(
        ` (${unPushed2.split('\n').filter(u => u).length} commits unpushed)`
      )
    }
    console.log()
  } catch (err) {
    ctx.logger.error(err)
    process.exit(0)
  }
}

module.exports = entry
