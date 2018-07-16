const execa = require('execa')
const inquirer = require('inquirer')
const { pkgExist, readPkg } = require('./pkg')

const root = process.cwd()

async function publish () {
  if (await pkgExist()) {
    const answer = await inquirer.prompt({
      type: 'confirm',
      name: 'npmPublish',
      message: 'Publish to npmjs.com ?',
      default: false
    })

    if (answer && answer.npmPublish) {
      const pkg = readPkg()
      let cmd = 'npm publish'
      if (pkg.name && pkg.name.startsWith('@')) {
        const answerPub = await inquirer.prompt({
          type: 'confirm',
          name: 'public',
          message: 'This is a scoped package, publish as public ?',
          default: true
        })

        if (answerPub && answerPub.public) {
          cmd += ' --access=public'
        }
      }

      await execa.shell(cmd, {
        cwd: root
      })
      ctx.logger.success('Publish successfully\n')
    }
  }
}
module.exports = publish
