const path = require('path')
const execa = require('execa')
const inquirer = require('inquirer')
const { bootstrap } = require('@peak-stone/commitizen-promise/dist/cli/git-cz')
const { getStatus, getStaged, getUnpushedCommits } = require('./git')

function czCommit () {
  return bootstrap({
    cliPath: '@peak-stone/commitizen-promise',
    config: {
      path: '@peak-stone/cz-fbi'
    }
  })
}

async function commit (options) {
  try {
    const needAdd = await getStatus()
    const unPushed = await getUnpushedCommits()
    if (unPushed) {
      console.log(
        ` (${unPushed.split('\n').filter(u => u).length} commits unpushed)`
      )
    }
    console.log()

    if (Array.isArray(needAdd)) {
      // select files to add
      const answer = await inquirer.prompt({
        type: 'checkbox',
        name: 'files',
        message: 'select files staged for commit:',
        choices: needAdd.map(n => {
          return { name: n }
        })
      })

      if (answer && answer.files && answer.files.length > 0) {
        // add files
        const filesToAdd = answer.files.length === needAdd.length
          ? '.'
          : answer.files.join(' ')

        await execa.shell(`git add ${filesToAdd}`, {
          cwd: options.repoPath
        })

        await czCommit()
        return true
      }
    }

    const hasStaged = await getStaged()
    if (hasStaged) {
      await czCommit()
      return true
    } else {
      ctx.logger.warn('Nothing to commit')
    }
  } catch (err) {
    throw err
  }
}

module.exports = commit
