module.exports = {
  en: {
    translation: {
      status: {
        noUpstream: 'Current branch has no upstream',
        noCommit: 'Nothing to commit',
        noUnpushed: 'Nothing to push',
        flowNotFound: 'Configs of "{{current}}" not found, use default "{{def}}"',
        'Alredy staged': 'Alredy staged',
        branchExist: "Branch '{{- branchName}}' already exist",
        currentBranch: 'current branch'
      },
      title: {
        chooseAction: 'Choose an action',
        chooseBranchType: 'Choose an branch type',
        chooseBranch: 'Choose an branch to {{action}}',
        switchBranch: 'Switch to branch',
        inputNewBranchName: 'Input the new branch name',
        pushToRemote: 'Push to remote',
        setUpStream: 'set upstream branch',
        selectForStaged: 'Select for staged',
        done: 'DONE'
      },
      actions: {
        status: 'status',
        commit: 'commit',
        release: 'release',
        sync: 'sync',
        'new branch': 'new branch',
        'sync branch': 'sync branch',
        'switch-branch': 'switch-branch',
        helpers: 'helpers',
        exit: 'exit'
      }
    }
  },
  cn: {
    translation: {
      status: {
        noUpstream: '当前分支无上游分支',
        noCommit: '无需提交',
        noUnpushed: '无需推送',
        flowNotFound: '"{{current}}" 的配置未找到, 使用默认的 "{{def}}"',
        'Alredy staged': '待提交',
        branchExist: "分支 '{{- branchName}}' 已存在",
        currentBranch: ' 当前分支'
      },
      title: {
        chooseAction: '选择一个操作',
        chooseBranchType: '选择一个分支类型',
        chooseBranch: ' 选择一个分支来{{action}}',
        switchBranch: ' 切换分支',
        inputNewBranchName: '输入新分支的名称',
        pushToRemote: '推送到远端',
        setUpStream: '设置上游分支',
        selectForStaged: '选择提交',
        done: '完成'
      },
      actions: {
        status: '查看状态',
        commit: '提交',
        release: '发布',
        sync: ' 同步',
        'new branch': '新建分支',
        'sync branch': '同步分支',
        'switch-branch': '切换分支',
        helpers: '工具类',
        exit: '退出'
      }
    }
  }
}
