module.exports = async ({ base, baseProtected, name, statusCheck, git }) => {
  await git.checkout(base).catch(statusCheck)

  if (baseProtected) {
    await git.resetHard(`origin/${base}`)
  } else {
    await git.merge(`origin/${base}`, '--ff').catch(statusCheck)
  }

  await git.branch.add(name, base)
}
