const git = require('./lib/utils/git')
const i18n = require('./lib/utils/i18n')
const config = require('./lib/config')
const action = require('./lib/action')
const helper = require('./lib/helper')

const style = ctx.utils.style
const log = console.log
const exec = ctx.utils.exec
const fs = ctx.utils.fs
const io = require('inquirer')
const assign = ctx.utils.assign

let configs

async function statusCheck () {
  const next = await helper.checkStatus(configs)
  if (next && action.actions[next]) {
    await action.actions[next](params)
  }
}

const params = {
  io,
  fs,
  log,
  git,
  exec,
  style,
  helper,
  assign,
  configs,
  statusCheck
}

module.exports = async () => {
  // i18n
  const t = await i18n('en')
  helper['t'] = t

  // git init
  if (!await git.isRepo()) {
    return helper.gitInit()
  }

  // init configs
  configs = params.configs = await config({
    helper,
    git,
    assign,
    style,
    log
  })

  // start flow
  if (configs.hooks.before) {
    for (let _a of configs.hooks.before) {
      if (action.actions[_a]) {
        try {
          await action.actions[_a](params)
        } catch (err) {
          throw err
        }
      }
    }
  }

  await action.entry(params)

  if (configs.hooks.after) {
    for (let _a of configs.hooks.after) {
      if (action.actions[_a]) {
        await action.actions[_a](params)
      }
    }
  }
}
