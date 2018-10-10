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
  // defaults
  const defConfigs = require('./configs')
  pathToFunction(defConfigs.flows)

  // user configs
  const userConfigs = ctx && ctx.options && ctx.options.commit
    ? ctx.options.commit
    : {}

  if (userConfigs.flows) {
    pathToFunction(userConfigs.flows, process.cwd())
  }

  configs = ctx.utils.assign({}, defConfigs, userConfigs)

  if (!Object.keys(configs.flows).includes(configs.flow)) {
    console.log(
      chalk.yellow(
        `\n${utils.t('status.flowNotFound', {
          current: configs.flow,
          def: configs.default
        })}\n`
      )
    )
    configs.flow = configs.default
  }

  configs['root'] = await status.rootPath()

  const currentFlow = configs.flows[configs.flow]
  configs['branches'] = currentFlow.branches
  configs['actions'] = currentFlow.actions
  configs['branches']['protected'] = Object.keys(
    configs['branches']['long-lived']
  ).filter(b => configs['branches']['long-lived'][b].protected)

  return configs
}

async function statusCheck () {
  const next = await utils.check(configs)
  if (next) {
    await flows[next](params)
  }
}

async function main () {
  const messagePrefix = `${await utils.promptPrefix()}[${chalk.yellow(configs.flow)}]`

  let actions = Object.keys(configs.actions)

  if (configs.hooks) {
    if (configs.hooks.pre) {
      actions.unshift(...configs.hooks.pre, new inquirer.Separator())
    }
    if (configs.hooks.post) {
      actions.push(new inquirer.Separator(), ...configs.hooks.post)
    }
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
  if (configs.hooks.post.includes('helpers')) {
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
    : configs.actions[actionName] || flows[actionName]

  try {
    fn && (await fn(params))
    if (configs.logs.DONE) {
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
  console.log(JSON.stringify(configs, null, 2))

  // start flow
  if (configs.hooks.before && flows[configs.hooks.before]) {
    await flows[configs.hooks.before](params)
    console.log()
  }

  await main()

  if (configs.hooks.after && flows[configs.hooks.after]) {
    await flows[configs.hooks.after](params)
  }
}

module.exports = entry
