const execa = require('execa')
const getStream = require('get-stream')
const inquirer = require('inquirer')

const isWin = process.platform === 'win32'
const root = process.cwd()

async function isGitRepo (dir) {
  try {
    const ret = await execa.shell('git rev-parse --git-dir', {
      cwd: dir
    })
    return !!ret
  } catch (err) {
    return false
  }
}

function showStatus (filepath) {
  return execa.shell(`git status --short ${filepath || ''}`, {
    cwd: root,
    stdio: 'inherit'
  })
}

async function getStatus (filepath, nolog) {
  const cmd = isWin
    ? `git status ${filepath || ''} --porcelain`
    : `git status ${filepath || ''} --porcelain | sed s/^...//`
  const stream = execa.shell(cmd, {
    cwd: root
  }).stdout

  const stdout = await getStream(stream)

  let ret = stdout.trim()

  if (ret && !nolog) {
    ret = ret.split('\n').filter(p => p.trim())
    if (isWin) {
      ret = ret.map(i => i.slice(3))
    }
    console.log()
    ctx.logger.info('current status:')
    await showStatus()
  }
  return ret
}

// show only staged files
async function getStaged () {
  // git diff --staged
  // git diff --cached --name-only
  // git diff --name-only --cached | xargs
  const stream = execa.shell('git diff --name-only --cached', {
    cwd: root
  }).stdout
  let stdout = await getStream(stream)
  stdout = stdout.trim()

  if (stdout) {
    ctx.logger.info('files to commit:')
    console.log(ctx.utils.style.green(stdout))
    console.log()
  }
  return stdout
}

// This will list out your local comment history (not yet pushed) with corresponding message
// git reflog
async function getUnpushedCommits () {
  const stream = execa.shell('git cherry -v', {
    cwd: root
  }).stdout

  return getStream(stream)
}

async function push (args) {
  return execa.shell(`git push ${args || ''}`, {
    cwd: root,
    stdio: 'inherit'
  })
}

function isClean () {
  return getStatus('', true)
}

async function gitInit () {
  const answer = await inquirer.prompt({
    type: 'confirm',
    name: 'initNow',
    message: 'This is not a git repository. "git init" now?',
    default: false
  })

  if (answer && answer.initNow) {
    return execa.shell('git init', {
      cwd: root
    })
  } else {
    process.exit(0)
  }
}

module.exports = {
  isGitRepo,
  showStatus,
  getStatus,
  getStaged,
  getUnpushedCommits,
  push,
  isClean,
  gitInit
}
