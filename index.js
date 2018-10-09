const path = require('path')
const chalk = require('chalk')
const inquirer = require('inquirer')
const flows = require('./lib/flows/')
const status = require('./lib/helpers/status')
const utils = require('./lib/helpers/utils')
const exec = require('./lib/helpers/exec')
const i18n = require('./lib/helpers/i18n')

let configs
const params = {
  configs,
  status,
  utils,
  inquirer,
  chalk,
  exec,
  statusCheck
}

function pathToFunction (obj, basePath) {
  for (let [key, val] of Object.entries(obj)) {
    try {
      obj[key] = require(path.join(basePath || __dirname, val))
    } catch (err) {
      delete obj[key]
      console.log(chalk.red(`Cannot find module "${val}"`))
    }
  }
}

const initConfigs = async () => {
  const defConfigs = require('./configs')
  pathToFunction(defConfigs.flows)
  const userConfigs = ctx && ctx.options ? ctx.options.commit : {}
  pathToFunction(userConfigs.flows || {}, process.cwd())

  configs = Object.assign({}, defConfigs, userConfigs)
  const allFlowsNames = Object.keys(configs.flows)
  configs['root'] = await status.rootPath()

  const defName = 'No Flow'
  let flowName = configs['flow-name']
  if (!allFlowsNames.includes(flowName)) {
    console.log(
      chalk.yellow(
        `\n${utils.t('status.flowNotFound', { flowName, defName })}\n`
      )
    )
    flowName = defName
  }
  configs.flow = configs.flows[flowName]
  configs['flow-name'] = flowName

  return configs
}

async function statusCheck () {
  const next = await flows.check(params)
  if (next) {
    await flows[next](params)
  }
}

async function main () {
  const messagePrefix = `${await utils.promptPrefix()}[${chalk.yellow(configs['flow-name'])}]`

  let actions = Object.keys(configs.flow)

  if (configs.actions && configs.actions.pre) {
    actions.unshift(...configs.actions.pre, new inquirer.Separator())
  }
  if (configs.actions && configs.actions.post) {
    actions.push(new inquirer.Separator(), ...configs.actions.post)
  }

  actions = actions.map(a => ({
    name: typeof a === 'string' ? utils.t(`actions.${a}`) : a,
    value: a
  }))

  const prompts = [
    {
      type: 'list',
      name: 'flowName',
      message: `${messagePrefix} ${utils.t('title.chooseAction')}:`,
      choices: actions,
      pageSize: 20
    }
  ]
  if (configs.actions.post.includes('helpers')) {
    prompts.push({
      type: 'list',
      name: 'helper',
      message: 'Choose a helper',
      when (answers) {
        return answers.flowName === 'helpers'
      },
      choices: Object.keys(flows['helpers']).map(h => ({
        name: h.replace(/-/g, ' '),
        value: h
      })),
      pageSize: 20
    })
  }
  const { flowName, helper } = await inquirer.prompt(prompts)

  const actionName = helper ? `helpers:${helper}` : flowName
  const fn = helper
    ? flows['helpers'][helper]
    : configs.flow[actionName] || flows[actionName]

  fn && (await fn(params))

  if (configs.logs.DONE) {
    console.log(
      chalk.green(
        `${utils.t('title.done')}: ${utils.t(`actions.${actionName}`)}\n`
      )
    )
  }

  await main()
}

async function entry () {
  // i18n
  const t = await i18n('en')
  utils['t'] = t

  // git init
  if (!await status.isGitRepo()) {
    return utils.gitInit()
  }

  // init configs
  await initConfigs()

  // start flow
  if (configs.actions.before && flows[configs.actions.before]) {
    await flows[configs.actions.before](params)
    console.log()
  }

  await main()

  if (configs.actions.after && flows[configs.actions.after]) {
    await flows[configs.actions.after](params)
  }
}

module.exports = entry
