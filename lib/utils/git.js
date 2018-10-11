const exec = (
  cmd,
  opts = {
    maxBuffer: 200 * 1024
  }
) => ctx.utils.exec(cmd, opts)

function eee (x) {
  var lf = typeof x === 'string' ? '\n' : '\n'.charCodeAt()
  var cr = typeof x === 'string' ? '\r' : '\r'.charCodeAt()

  if (x[x.length - 1] === lf) {
    x = x.slice(0, x.length - 1)
  }

  if (x[x.length - 1] === cr) {
    x = x.slice(0, x.length - 1)
  }

  return x
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

const isRepo = () => exec('git rev-parse --git-dir').catch(() => false)

const root = () => exec('git rev-parse --show-toplevel')

const branch = {
  // info
  current: () => exec('git rev-parse --abbrev-ref HEAD'),
  locals: () => exec('git branch -vv --format="%(refname:short)"').then(s2a),
  remotes: () =>
    exec('git branch -vvr --format="%(refname:lstrip=3)"')
      .then(s2a)
      .then(r => r.filter(n => n !== 'HEAD')),
  stales: () =>
    exec(
      'git branch -vv --format="%(if:equals=gone)%(upstream:track,nobracket)%(then)%(refname:short)%(end)"'
    ).then(s2a),
  needMerge: (n1, n2) => exec(`git rev-list -1 ${n1} --not ${n2}`),

  // action
  add: (n, from) => exec(`git checkout -b ${n} ${from} --quiet`),
  del: (n, force) => exec(`git branch -${force ? 'D' : 'd'} ${n}`),
  delRemote: n => exec(`git push origin --delete ${n}`),
  checkout: n => exec(`git checkout ${n} --quiet`)
}

const tag = {
  // info
  list: opts => exec('git tag', opts).then(s2a),
  latest: () => exec('git describe --abbrev=0'),

  // action
  add: n => exec(`git tag -a ${n}`),
  del: n => exec(`git tag -d ${n}`),
  checkout: n => exec(`git checkout ${n} --quiet`)
}

const stash = {
  // info
  list: () => exec('git stash list').then(s2a),

  // action
  add: argv => exec(`git stash ${argv}`),
  pop: () => exec('git stash pop'),
  clear: () => exec('git stash clear')
}

const status = {
  // info
  untracked: () => exec('git ls-files --others --exclude-standard').then(s2a),
  modified: () => exec('git diff --name-only --diff-filter=M').then(s2a),
  deleted: () => exec('git diff --name-only --diff-filter=D').then(s2a),
  conflicts: () => exec('git diff --name-only --diff-filter=U').then(s2a),
  staged: () => exec('git diff --name-only --cached').then(s2a),
  unpushed: () => exec('git cherry -v').then(s2a),
  isRebasing: () =>
    exec('git status').then(r => r.includes('rebase in progress')),
  conflictStrings: () => exec('git grep -n "<<<<<<< "').then(s2a),
  conflictFiles: () => exec('git grep --name-only "<<<<<<< "').then(s2a),
  changes: () => exec('git status --porcelain').then(s2a),

  // action
  show: () =>
    exec('git status --short', {
      stdio: 'inherit'
    })
}

const init = () => exec('git init')
const fetch = argv => exec(`git fetch ${argv}`)
const pull = argv => exec(`git pull ${argv}`)
const push = argv => exec(`git push ${argv}`)
const add = arr => exec(`git add ${pathOrAll(arr)}`)
const del = arr => (validArr(arr) ? exec(`git rm ${arr.join(' ')}`) : null)
const checkout = arr =>
  exec(`git checkout ${Array.isArray(arr) ? pathOrAll(arr) : arr} --quiet`)
const merge = (t, argv) => exec(`git merge ${argv} ${t}`)
const clean = () => exec('git gc')
const resetHard = n => exec(`git reset --hard ${n}`)

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
