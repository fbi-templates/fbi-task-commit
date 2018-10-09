const execa = require('execa')
const getStream = require('get-stream')

module.exports = async (cmd, opts = {}) => {
  try {
    const v = ctx ? ctx.task.params.commit.v : null
    if (!opts.quiet && v) {
      let currentBranch
      try {
        const ret = await execa.shell('git rev-parse --abbrev-ref HEAD')
        currentBranch = ret.stdout
      } catch (err) {}
      const prefix = currentBranch ? `[${currentBranch}]` : ''
      console.log(`\n${prefix} ${cmd}`)
    }

    const stream = execa.shell(cmd, opts)
    const stdout = stream.stdout ? await getStream(stream.stdout) : ''
    const stderr = stream.stderr ? await getStream(stream.stderr) : ''
    // console.log('stdout:', stdout)
    // console.log('stderr:', stderr)

    if (stderr && !opts.ignoreStderr) {
      throw new Error(stderr)
    }

    return stdout.trim()
  } catch (err) {
    throw err
  }
}
