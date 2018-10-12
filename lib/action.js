const actions = {
  check: require('./flows/base/check'),
  status: require('./flows/base/status'),
  commit: require('./flows/base/commit'),
  rebase: require('./flows/base/rebase'),
  setup: require('./flows/base/setup'),
  helpers: require('./flows/base/helpers'),
  exit () {
    process.exit(0)
  },
  'switch-branch': require('./flows/switch-branch'),
  'new branch': require('./flows/new-branch'),
  'sync branch': require('./flows/sync-branch'),
  release: require('./flows/release')
}

async function actionHookPre ({ git }) {
  await git.stash.add('-u')
  await git.fetch('--all --prune')
}

async function actionHookPost ({ git }) {
  const hasStash = await git.stash.list()
  if (hasStash && hasStash.length > 0) {
    await git.stash.pop().catch(statusCheck)
  }
}

async function entry (params) {
  const { io, git, log, style, helper, configs, statusCheck } = params
  const messagePrefix = `${await helper.promptPrefix()}[${style.yellow(configs.flow)}]`

  let actionNames = JSON.parse(JSON.stringify(configs.actions))

  if (configs.hooks) {
    if (configs.hooks.pre) {
      actionNames.unshift(...configs.hooks.pre, new io.Separator())
    }
    if (configs.hooks.post) {
      actionNames.push(new io.Separator(), ...configs.hooks.post)
    }
  }

  actionNames = actionNames.map(a => {
    if (typeof a === 'string') {
      return {
        name: typeof a === 'string' ? helper.t(`actions.${a}`) : a,
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
      message: `${messagePrefix} ${helper.t('title.chooseAction')}:`,
      choices: actionNames,
      pageSize: 20
    }
  ]

  if (configs.hooks.post.includes('helpers')) {
    prompts.push({
      type: 'list',
      name: 'util',
      message: 'Choose a helper',
      when (answers) {
        return answers.flowName === 'helpers'
      },
      choices: Object.keys(actions['helpers']).map(h => ({
        name: h.replace(/-/g, ' '),
        value: h
      })),
      pageSize: 20
    })
  }

  const { flowName, util } = await io.prompt(prompts)

  const actionName = util ? `helpers:${util}` : flowName
  const fn = util ? actions['helpers'][util] : actions[actionName]

  try {
    if (fn) {
      await actionHookPre(params)
      await fn(params)
      await actionHookPost(params)

      if (configs.logs.DONE) {
        log(
          style.green(
            `${helper.t('title.done')}: ${helper.t(`actions.${actionName}`)}\n`
          )
        )
      }
    }
  } catch (err) {
    log(style.red(err))
    log(err)
  }

  await entry(params)
}

module.exports = {
  entry,
  actions
}
