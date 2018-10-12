module.exports = async ({ helper, git, assign, style, log }) => {
  // defaults
  const defConfigs = require('../configs.json')
  // user configs
  const userConfigs = ctx.options ? ctx.options.commit || {} : {}
  let configs = assign({}, defConfigs, userConfigs)

  const _flows = {
    'no-flow': require('../configs/no-flow'),
    'git-flow': require('../configs/git-flow'),
    'github-flow': require('../configs/github-flow'),
    'gitlab-flow': require('../configs/gitlab-flow')
  }

  if (!Object.keys(_flows).includes(configs.flow)) {
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

  configs = assign({}, configs, _flows[configs.flow])

  configs['root'] = await git.root()
  configs['flows'] = assign({}, _flows, userConfigs.flows || {})

  configs['branches']['protected'] = Object.keys(
    configs['branches']['long-lived']
  ).filter(b => configs['branches']['long-lived'][b].protected)

  return configs
}
