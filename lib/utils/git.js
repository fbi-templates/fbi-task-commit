const exec = async (
  cmd,
  opts = {
    maxBuffer: 200 * 1024
  }
) => {
  console.log(
    `[${await ctx.utils.exec('git rev-parse --abbrev-ref HEAD', opts)}] git ${cmd}`
  )
  return ctx.utils.exec(`git ${cmd}`, opts)
}

// string to array
const s2a = s =>
  (s
    ? s
        .split('\n')
        .map(b => b.replace(/^[\'\"]+|[\'\"]+$/g, '').trim())
        .filter(l => l.trim())
    : null)
// path or all
const pathOrAll = arr => (arr && arr.length > 0 ? arr.join(' ') : '.')
const validArr = arr => arr && arr.length > 0

const isRepo = () => exec('rev-parse --git-dir').catch(() => false)

const root = () => exec('rev-parse --show-toplevel')

const branch = {
  // info
  current: () => exec('rev-parse --abbrev-ref HEAD'),
  locals: () => exec('branch -vv --format="%(refname:short)"').then(s2a),
  remotes: () =>
    exec('branch -vvr --format="%(refname:lstrip=3)"')
      .then(s2a)
      .then(r => r.filter(n => n !== 'HEAD')),
  stales: () =>
    exec(
      'branch -vv --format="%(if:equals=gone)%(upstream:track,nobracket)%(then)%(refname:short)%(end)"'
    ).then(s2a),
  upstream: n =>
    exec(`rev-parse --abbrev-ref ${n || 'HEAD'}@{upstream}`).catch(() => false),
  needMerge: (n1, n2) => exec(`rev-list -1 ${n1} --not ${n2}`),

  // action
  add: (n, from) => exec(`checkout -b ${n} ${from} --quiet`),
  del: (n, force) => exec(`branch -${force ? 'D' : 'd'} ${n}`),
  delRemote: n => exec(`push origin --delete ${n}`),
  checkout: n => exec(`checkout ${n} --quiet`)
}

const tag = {
  // info
  list: opts => exec('tag', opts).then(s2a),
  latest: () => exec('describe --abbrev=0'),

  // action
  add: n => exec(`tag -a ${n}`),
  del: n => exec(`tag -d ${n}`),
  checkout: n => exec(`checkout ${n} --quiet`)
}

const stash = {
  // info
  list: () => exec('stash list').then(s2a),

  // action
  add: argv => exec(`stash ${argv}`),
  pop: () => exec('stash pop'),
  clear: () => exec('stash clear')
}

const status = {
  // info
  untracked: () => exec('ls-files --others --exclude-standard').then(s2a),
  modified: () => exec('diff --name-only --diff-filter=M').then(s2a),
  deleted: () => exec('diff --name-only --diff-filter=D').then(s2a),
  conflicts: () => exec('diff --name-only --diff-filter=U').then(s2a),
  staged: () => exec('diff --name-only --cached').then(s2a),
  unpushed: () => exec('cherry -v').then(s2a),
  isRebasing: () => exec('status').then(r => r.includes('rebase in progress')),
  conflictStrings: () => exec('grep -n "<<<<<<< "').then(s2a),
  conflictFiles: () => exec('grep --name-only "<<<<<<< "').then(s2a),
  changes: () => exec('status --porcelain').then(s2a),

  // action
  show: () =>
    exec('status --short', {
      stdio: 'inherit'
    })
}

const init = () => exec('init')
const fetch = argv => exec(`fetch ${argv}`)
const pull = argv => exec(`pull ${argv}`)
const push = argv => exec(`push ${argv} --quiet`)
const add = arr => exec(`add ${pathOrAll(arr)}`)
const del = arr => (validArr(arr) ? exec(`rm ${arr.join(' ')}`) : null)
const checkout = arr =>
  exec(`checkout ${Array.isArray(arr) ? pathOrAll(arr) : arr} --quiet`)
const merge = (t, argv) => exec(`merge ${argv} ${t}`)
const clean = () => exec('gc')
const resetHard = n => exec(`reset --hard ${n}`)

module.exports = {
  // info
  isRepo,
  root,
  branch,
  tag,
  stash,
  status,

  // action
  init,
  fetch,
  pull,
  push,
  add,
  del,
  checkout,
  merge,
  clean,
  resetHard,

  // util
  exec
}
