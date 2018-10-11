const newBranchHelper = require('../../helpers/new-branch')

module.exports = async ({ configs, status, statusCheck, chalk, exec }) => {
  const remoteBranches = await status.remoteBranches()
  const longLivedBranches = Object.keys(configs.branches['long-lived'])

  const noexist = longLivedBranches.filter(b => !remoteBranches.includes(b))

  if (noexist.length > 0) {
    for (let name of noexist) {
      const base = configs.branches['long-lived'][name].baseOn || 'master'
      const baseProtected = Boolean(
        configs.branches['long-lived'][base].protected
      )

      if (!await status.hasLocalBranch(name)) {
        console.log(
          chalk.yellow(
            `Long-lived remote branch '${name}' does not exist, creating...`
          )
        )
        // create the branch
        await newBranchHelper({
          base,
          baseProtected,
          name,
          statusCheck
        })
      }

      // push to remote
      await exec(`git push --set-upstream origin ${name}`)
      console.log(`Branch '${name}' created and pushed to remote`)
    }
  }
}
