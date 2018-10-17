module.exports = async ({ helper, git, assign, style, log }) => {
  const defConfigs = require('../configs.json')
  const userConfigs = ctx.options ? ctx.options.commit || {} : {}
  log(userConfigs)
  let configs = assign({}, defConfigs, userConfigs)

  const defaultFlows = {
    'no-flow': require('../configs/no-flow'),
    'git-flow': require('../configs/git-flow'),
    'github-flow': require('../configs/github-flow'),
    'gitlab-flow': require('../configs/gitlab-flow')
  }

  configs['flows'] = assign({}, defaultFlows, userConfigs.flows || {})

  if (!Object.keys(configs.flows).includes(configs.flow)) {
    log(
      style.yellow(
        `${helper.t('status.flowNotFound', {
          current: configs.flow,
          def: configs.default
        })}`
      )
    )
    configs.flow = configs.default
  }

  configs = assign({}, configs, defaultFlows[configs.flow])

  if (userConfigs.branches) {
    configs['branches'] = userConfigs.branches
  }
  if (userConfigs.actions) {
    configs['actions'] = userConfigs.actions
  }

  configs['root'] = await git.root()

  configs['branches']['protected'] = Object.keys(
    configs['branches']['long-lived']
  ).filter(b => configs['branches']['long-lived'][b].protected)
  log(configs)
  return configs
}
