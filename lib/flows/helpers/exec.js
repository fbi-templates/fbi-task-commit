const chalk = require('chalk')
const execa = require('execa')
const getStream = require('get-stream')

const quietCmds = ['git checkout']
const inheritCmds = ['git rebase -i', 'git push']

function parseCmd (_cmd, opts) {
  const cmd = quietCmds.some(c => _cmd.startsWith(c)) ? _cmd + ' --quiet' : _cmd

  if (inheritCmds.some(c => _cmd.includes(c))) {
    opts['stdio'] = 'inherit'
  }

  return cmd
}

module.exports = async (cmd, opts = {}) => {
  try {
    const parsedCmd = parseCmd(cmd, opts)

    const v = ctx ? ctx.task.params.commit.v : null
    if (!opts.quiet && v) {
      let currentBranch
      try {
        const ret = await execa.shell('git rev-parse --abbrev-ref HEAD')
        currentBranch = ret.stdout
      } catch (err) {}
      const prefix = currentBranch ? `[${currentBranch}]` : ''
      console.log(`\n${prefix} ${parsedCmd}`)
    }

    if (opts.stdio === 'inherit') {
      return execa.shell(parsedCmd, opts)
    }

    const stream = execa.shell(parsedCmd, opts)
    const stdout = stream.stdout ? await getStream(stream.stdout) : ''
    const stderr = stream.stderr ? await getStream(stream.stderr) : ''

    if (stderr && !opts.ignoreStderr) {
      throw new Error(stderr)
    }

    return stdout.trim()
  } catch (err) {
    throw err
  }
}
