const standardVersion = require('standard-version')
const { pkgExist } = require('../helpers/pkg')
const git = require('../helpers/git')
const exec = require('../helpers/exec')
const status = require('../helpers/status')

async function bumpVersion (options) {
  try {
    await standardVersion(options)
  } catch (err) {
    console.error(`standard-version failed with message: ${err.message}`)
  }
}

module.exports = async (configs, statusCheck, _baseBranch) => {
  // TODO
  const baseBranch = _baseBranch || configs.flow.branch.base
  const currentBranch = await status.currentBranch()
  // const targetBranch = await chooseBranch(currentBranch, configs)
  const targetBranch = await git.chooseBranch(currentBranch, configs, 'release')

  return

  await exec(`git checkout ${baseBranch}`, {
    ignoreStderr: false
  }).catch(err => statusCheck())

  // update baseBranch
  await exec('git fetch --prune')
  await exec(`git rebase origin/${baseBranch}`).catch(err => statusCheck())

  // create a temp releaseBranch
  const hash = await status.latestCommitHash()
  const releaseBranch = `release-${hash}`
  await exec(`git branch ${releaseBranch} ${baseBranch}`, {
    ignoreStderr: true
  })

  await exec(`git checkout ${configs.master}`, {
    ignoreStderr: false
  }).catch(err => statusCheck())

  // update configs.master
  await exec('git fetch --prune')
  await exec(`git rebase origin/${configs.master}`).catch(err => statusCheck())

  // merge releaseBranch to configs.master
  await exec(`git merge --no-edit ${releaseBranch}`).catch(err => {
    console.log('err:', err)
    return statusCheck()
  })

  // await statusCheck()

  if (await pkgExist()) {
    await bumpVersion(configs['standard-version'])
  } else {
    // TODO
  }

  await exec('git push --follow-tags', {
    ignoreStderr: true
  })

  // merge releaseBranch to configs.develop
  await exec(`git checkout ${configs.develop}`, {
    ignoreStderr: false
  }).catch(err => statusCheck())
  await exec(`git merge --squash ${releaseBranch}`).catch(err => statusCheck())
  await exec('git push', {
    ignoreStderr: true
  })
  await exec(`git branch -D ${releaseBranch}`)
}
