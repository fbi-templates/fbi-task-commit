const inquirer = require('inquirer')
const chalk = require('chalk')
const flows = require('./lib/flows/')
const status = require('./lib/helpers/status')
const utils = require('./lib/helpers/utils')
let configs

process.on('unhandledRejection', (reason, promise) => {
  ctx.logger.error(
    'Unhandled Rejection at: Promise ',
    promise,
    ' reason: ',
    reason
  )
  throw reason
})

process.on('uncaughtException', async error => {
  ctx.logger.error(error)
  process.exit(0)
})

async function initConfigs () {
  const defConfigs = require('./configs.json')
  const userConfigs = ctx && ctx.options ? ctx.options.commit : null
  const flowNames = Object.keys(defConfigs.flow)
  const configs = JSON.parse(JSON.stringify(defConfigs))

  if (userConfigs) {
    if (userConfigs.flow) {
      if (
        typeof userConfigs.flow === 'string' &&
        flowNames.includes(userConfigs.flow)
      ) {
        configs.flow = {
          ...configs.flow[userConfigs.flow],
          name: userConfigs.flow
        }
      } else if (
        userConfigs.flow.name &&
        flowNames.includes(userConfigs.flow)
      ) {
        configs.flow = userConfigs.flow
      } else {
        console.log('config error')
      }
    } else {
      configs.flow = {
        ...configs.flow[flowNames[0]],
        name: flowNames[0]
      }
    }
    configs['standard-version'] = Object.assign(
      {},
      configs['standard-version'],
      userConfigs['standard-version'] || {}
    )
  } else {
    configs.flow = {
      ...configs.flow[flowNames[0]],
      name: flowNames[0]
    }
  }

  configs['root'] = await status.rootPath()

  return configs
}

async function statusCheck () {
  const next = await flows.check(configs)
  if (next) {
    await flows[next]()
  } else {
    await flows.commit()
  }
}

async function mainFlow (configs, statusCheck) {
  let choices
  switch (configs.flow.name) {
    case 'github':
      choices = [
        {
          name: 'new branch',
          value: 'new-branch'
        },
        {
          name: 'sync branch',
          value: 'sync-branch'
        },
        {
          name: 'release',
          value: 'release'
        }
      ]
    case 'gitlab':
    case 'gitflow':
      choices = [
        {
          name: 'new branch',
          value: 'new-branch'
        },
        {
          name: 'sync branch',
          value: 'sync-branch'
        },
        {
          name: 'release pre-production',
          value: 'release-pre-production'
        },
        {
          name: 'release production',
          value: 'release-production'
        }
      ]
      break
    default:
      choices = [
        {
          name: 'sync branch',
          value: 'sync-branch'
        },
        {
          name: 'release',
          value: 'release'
        }
      ]
      break
  }

  choices = [
    {
      name: 'show status',
      value: 'show-status'
    },
    {
      name: 'commit',
      value: 'commit'
    }
  ].concat(choices)
  choices.push(new inquirer.Separator())
  choices = choices.concat([
    {
      name: 'helpers',
      value: 'helpers'
    },
    {
      name: 'exit',
      value: 'exit'
    }
  ])

  console.log()
  const { flowName, helper } = await inquirer.prompt([
    {
      type: 'list',
      name: 'flowName',
      message: `${await utils.promptPrefix()}[${chalk.yellow(configs.flow.name + ' flow')}] Choose a action:`,
      choices,
      pageSize: 20
    },
    {
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
    }
  ])

  const actionName = helper ? `helpers:${helper}` : flowName
  const fn = helper ? flows['helpers'][helper] : flows[actionName]

  if (actionName === 'exit') {
    return
  }

  if (actionName === 'commit') {
    if (await status.canCommit(configs)) {
      await fn()
    } else {
      console.log('nothing to commit')
    }
  } else {
    await fn(configs, statusCheck)
  }

  console.log(chalk.green(`DONE: ${actionName.replace(/-/g, ' ')}`))

  await mainFlow(configs, statusCheck)
}

const exec = require('./lib/helpers/exec')
const execa = require('execa')

async function entry () {
  // const staleBranches = await status.staleBranches('feature/demo')
  // console.log('staleBranches:', staleBranches)
  // return

  configs = await initConfigs()
  try {
    await flows.init(configs)
    // await statusCheck()
    await flows['show-status']()
    // return

    const next = await flows.check(configs)
    if (next) {
      await flows[next]()
    }

    if (await status.canCommit(configs)) {
      await flows.commit()
    }

    await mainFlow(configs, statusCheck)
  } catch (err) {
    console.error(chalk.red(err.message))
    console.log(err)
  }
}

module.exports = entry
