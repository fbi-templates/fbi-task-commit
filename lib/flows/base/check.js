const newBranchHelper = require('../helpers/new-branch')

module.exports = async ({ git, log, style, configs, statusCheck }) => {
  const remoteBranches = await git.branch.remotes()
  const localBranches = await git.branch.locals()
  console.log(localBranches, remoteBranches)
  const longLivedBranches = Object.keys(configs.branches['long-lived'])

  const noexist = longLivedBranches.filter(b => !remoteBranches.includes(b))
  console.log('noexist:', noexist)

  if (noexist.length > 0) {
    for (let name of noexist) {
      const base = configs.branches['long-lived'][name].baseOn || 'master'
      const baseProtected = Boolean(
        configs.branches['long-lived'][base].protected
      )

      if (!localBranches.includes(name)) {
        log(
          style.yellow(
            `Long-lived remote branch '${name}' does not exist, creating...`
          )
        )
        // create the branch
        await newBranchHelper({
          base,
          baseProtected,
          name,
          statusCheck,
          git
        })
      }

      // push to remote
      await git.push(`--set-upstream origin ${name}`)
      log(`Branch '${name}' created and pushed to remote`)
    }
  }
}
