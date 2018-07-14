const path = require('path')
const inquirer = require('inquirer')
const standardVersion = require('standard-version')
const { pkgExist } = require('./pkg')
const configStandardVersion = require('../configs/standard-version.json')

async function bumpVersion () {
  try {
    await standardVersion(configStandardVersion)
  } catch (err) {
    console.error(`standard-version failed with message: ${err.message}`)
  }
}

async function bump () {
  if (await pkgExist()) {
    const answerBump = await inquirer.prompt({
      type: 'confirm',
      name: 'bumpVersion',
      message: 'Bump the package version?',
      default: false
    })

    if (answerBump && answerBump.bumpVersion) {
      await bumpVersion()
    }
  }
}

module.exports = {
  bump
}
