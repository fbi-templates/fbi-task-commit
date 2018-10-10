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
  let current

  // defaults
  const defConfigs = require('./configs')
  pathToFunction(defConfigs.flow.list)

  // user configs
  const userConfigs = ctx && ctx.options && ctx.options.commit
    ? ctx.options.commit
    : {
      flow: {}
    }
  userConfigs['flow'] = userConfigs['flow'] || {}
  if (typeof userConfigs.flow === 'string') {
    current = userConfigs.flow
    userConfigs.flow = {
      current
    }
  } else {
    current = userConfigs.flow.current || ''
  }

  if (userConfigs.flow.list) {
    pathToFunction(userConfigs.flow.list, process.cwd())
  }

  configs = ctx.utils.assign({}, defConfigs, userConfigs)

  const allFlowsNames = Object.keys(configs.flow.list)
  configs.flow['root'] = await status.rootPath()

  const def = configs.flow.default
  // let current = configs.flow['current']
  if (!current) {
    current = def
  }
  if (!allFlowsNames.includes(current)) {
    console.log(
      chalk.yellow(`\n${utils.t('status.flowNotFound', { current, def })}\n`)
    )
    current = def
  }
  configs.flow['current'] = current

  return configs
}

async function statusCheck () {
  const next = await status.check(configs)
  if (next) {
    await flows[next](params)
  }
}

async function main () {
  const currentFlow = configs.flow.list[configs.flow.current]
  const messagePrefix = `${await utils.promptPrefix()}[${chalk.yellow(configs.flow.current)}]`

  let actions = Object.keys(currentFlow)

  if (configs.flow.actions && configs.flow.actions.pre) {
    actions.unshift(...configs.flow.actions.pre, new inquirer.Separator())
  }
  if (configs.flow.actions && configs.flow.actions.post) {
    actions.push(new inquirer.Separator(), ...configs.flow.actions.post)
  }

  actions = actions.map(a => {
    if (typeof a === 'string') {
      return {
        name: typeof a === 'string' ? utils.t(`actions.${a}`) : a,
        value: a
      }
    } else {
      return a
    }
  })

  const prompts = [
    {
      type: 'list',
      name: 'flowName',
      message: `${messagePrefix} ${utils.t('title.chooseAction')}:`,
      choices: actions,
      pageSize: 20
    }
  ]
  if (configs.flow.actions.post.includes('helpers')) {
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
    : currentFlow[actionName] || flows[actionName]

  try {
    fn && (await fn(params))
    if (configs.flow.logs.DONE) {
      console.log(
        chalk.green(
          `${utils.t('title.done')}: ${utils.t(`actions.${actionName}`)}\n`
        )
      )
    }
  } catch (err) {
    console.log(chalk.red(err))
    console.log(err)
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
  params.configs = configs
  // console.log(configs)

  // start flow
  if (configs.flow.actions.before && flows[configs.flow.actions.before]) {
    await flows[configs.flow.actions.before](params)
    console.log()
  }

  await main()

  if (configs.flow.actions.after && flows[configs.flow.actions.after]) {
    await flows[configs.flow.actions.after](params)
  }
}

module.exports = entry
