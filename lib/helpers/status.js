const chalk = require('chalk')
const exec = require('./exec')

function isGitRepo () {
  return exec('git rev-parse --git-dir')
}

function stringToArray (str) {
  return str ? str.split('\n').filter(p => p.trim()) : null
}

function rootPath () {
  return exec('git rev-parse --show-toplevel')
}

function currentBranch (opts = {}) {
  return exec('git rev-parse --abbrev-ref HEAD', opts)
}

function upstreamExist (branchName) {
  return exec(
    `git branch -vv --format="%(if:equals=${branchName})%(refname:short)%(then)%(upstream)%(end)"`
  )
}

async function upstreamGone (branchName) {
  const state = await exec(
    `git branch -vv --format="%(if:equals=${branchName})%(refname:short)%(then)%(upstream:track,nobracket)%(end)"`
  )
  return state === 'gone'
}

async function upstreamValid (branchName) {
  const exist = await upstreamExist(branchName)
  // console.log('exist:', exist)

  const gone = await upstreamGone(branchName)
  // console.log('gone:', gone)

  return Boolean(exist && !gone)
}

async function staleBranches () {
  const paths = await exec(
    `git branch -vv --format="%(if:equals=gone)%(upstream:track,nobracket)%(then)%(refname:short)%(end)"`
  )
  return stringToArray(paths)
}

async function latestCommitHash () {
  return exec('git rev-parse --short HEAD')
}

async function branches () {
  const paths = await exec('git branch -vv --format="%(refname:short)"')
  return stringToArray(paths)
  // const paths = await exec('git branch')
  // const ret = stringToArray(paths)
  // return ret
  //   ? ret
  //       .map(r => r.replace('*', '').trim())
  //       .filter(r => !r.includes('no branch'))
  //   : null
}

async function tags () {
  const paths = await exec('git tag')
  return stringToArray(paths)
}

async function stashs () {
  const paths = await exec('git stash list')
  return stringToArray(paths)
}

async function conflicts () {
  const paths = await exec('git diff --name-only --diff-filter=U')
  return stringToArray(paths)
}

async function conflictsString () {
  const paths = await exec('git grep -n "<<<<<<< "')
  return stringToArray(paths)
}

async function conflictfiles () {
  const paths = await exec('git grep --name-only "<<<<<<< "')
  return stringToArray(paths)
}

async function untracked () {
  const paths = await exec('git ls-files --others --exclude-standard')
  return stringToArray(paths)
}

async function changed () {
  const hash = await latestCommitHash()
  const paths = await exec(`git diff --name-only ${hash}`)
  return stringToArray(paths)
}

async function staged () {
  // git diff --staged
  // git diff --cached --name-only
  // git diff --name-only --cached | xargs
  const paths = await exec('git diff --name-only --cached')
  return stringToArray(paths)
}

async function unpushed () {
  try {
    const paths = await exec('git cherry -v')
    return stringToArray(paths)
  } catch (err) {
    if (err.message.includes('Could not find a tracked remote branch')) {
      console.log('\nThis branch only exists locally')
    } else {
      console.log(chalk.red(err.message))
    }
    return null
  }
}

async function deleted () {
  const paths = await exec('git ls-files --deleted')
  return stringToArray(paths)
}

async function isRebasing () {
  const ret = await exec('git status')
  return ret.includes('rebase in progress')
}

async function allChanges () {
  const paths = await exec('git status --short')
  return stringToArray(paths)
}

async function canCommit (configs) {
  const changes = await allChanges()
  if (!changes) {
    return false
  }

  const branch = await currentBranch()
  const baseBranches = Object.values(configs.flow.branch)

  return configs.flow.name === 'default' || !baseBranches.includes(branch)
}

async function getStatus () {
  return {
    conflicts: await conflicts(),
    deleted: await deleted(),
    untracked: await untracked(),
    changed: await changed(),
    staged: await staged(),
    unpushed: await unpushed()
  }
}

module.exports = {
  isGitRepo,
  rootPath,
  currentBranch,
  upstreamGone,
  upstreamValid,
  staleBranches,
  latestCommitHash,
  branches,
  tags,
  stashs,
  conflicts,
  conflictsString,
  conflictfiles,
  untracked,
  changed,
  staged,
  unpushed,
  deleted,
  isRebasing,
  allChanges,
  canCommit,
  getStatus
}
