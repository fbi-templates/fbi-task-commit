const chalk = require('chalk')
const inquirer = require('inquirer')
const exec = require('./exec')

function isGitRepo () {
  try {
    return exec('git rev-parse --git-dir')
  } catch (err) {
    return err.message.includes('Not a git repository')
  }
}

function stringToArray (str) {
  return str ? str.split('\n').filter(p => p.trim()) : null
}

function rootPath () {
  return exec('git rev-parse --show-toplevel')
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

async function latestCommitHash () {
  return exec('git rev-parse --short HEAD')
}

async function localBranches () {
  const paths = await exec('git branch -vv --format="%(refname:short)"')
  return stringToArray(paths)
}

async function remoteBranches () {
  // const paths = await exec('git branch --remotes')
  // return stringToArray(paths)
  //   .filter(p => p.includes('->'))
  //   .map(p => p.replace('origin/', ''))
  const paths = await exec('git branch -vvr --format="%(refname:lstrip=3)"')
  return stringToArray(paths).filter(p => p !== 'HEAD')
}

async function hasRemoteBranch (_branch, _remoteBranches) {
  const __remoteBranches = _remoteBranches || (await remoteBranches())
  return __remoteBranches.includes(_branch)
}

function currentBranch (opts = {}) {
  return exec('git rev-parse --abbrev-ref HEAD', opts)
}

async function staleBranches () {
  const paths = await exec(
    `git branch -vv --format="%(if:equals=gone)%(upstream:track,nobracket)%(then)%(refname:short)%(end)"`
  )
  return stringToArray(paths)
}

async function tags () {
  const paths = await exec('git tag')
  return stringToArray(paths)
}

async function latestTag () {
  return exec('git describe --abbrev=0')
}

async function stashs () {
  const paths = await exec('git stash list')
  return stringToArray(paths)
}

async function untracked () {
  const paths = await exec('git ls-files --others --exclude-standard')
  return stringToArray(paths)
}

async function modified () {
  const paths = await exec('git diff --name-only --diff-filter=M')
  return stringToArray(paths)
}

async function deleted () {
  const paths = await exec('git diff --name-only --diff-filter=D')
  return stringToArray(paths)
}

async function conflicts () {
  const paths = await exec('git diff --name-only --diff-filter=U')
  return stringToArray(paths)
}

async function staged () {
  const paths = await exec('git diff --name-only --cached')
  return stringToArray(paths)
}

async function unpushed (utils) {
  try {
    // git cherry origin/master topic
    // git format-patch origin/master
    const paths = await exec('git cherry -v')
    return stringToArray(paths)
  } catch (err) {
    if (err.message.includes('Could not find a tracked remote branch')) {
      console.log(
        utils && utils.t
          ? utils.t('status.noUpstream')
          : '\nThis branch has no upstream branch'
      )
    } else {
      console.log(chalk.red(err.message))
    }
    return null
  }
}

async function conflictsString () {
  const paths = await exec('git grep -n "<<<<<<< "')
  return stringToArray(paths)
}

async function conflictfiles () {
  const paths = await exec('git grep --name-only "<<<<<<< "')
  return stringToArray(paths)
}

async function isRebasing () {
  const ret = await exec('git status')
  return ret.includes('rebase in progress')
}

async function changes () {
  const paths = await exec('git status --porcelain')
  return stringToArray(paths)
}

async function show () {
  // https://git-scm.com/docs/git-status#_short_format
  return exec('git status --short', {
    stdio: 'inherit'
  })
}

async function hasStashs () {
  const ret = await stashs()
  return stashs && stashs.length > 0
}

async function getStatus (utils) {
  return {
    conflicts: await conflicts(),
    deleted: await deleted(),
    untracked: await untracked(),
    modified: await modified(),
    staged: await staged(),
    unpushed: await unpushed(utils)
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
  localBranches,
  remoteBranches,
  hasRemoteBranch,
  tags,
  latestTag,
  stashs,
  hasStashs,
  conflicts,
  conflictsString,
  conflictfiles,
  untracked,
  modified,
  staged,
  unpushed,
  deleted,
  changes,
  isRebasing,
  show,
  getStatus
}
