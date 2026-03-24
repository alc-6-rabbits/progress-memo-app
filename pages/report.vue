<template>
  <div class="p-8 h-full glass-panel relative flex flex-col overflow-hidden font-mono">
    <div class="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-ace-highlight m-4 opacity-50"></div>
    <div class="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-ace-highlight m-4 opacity-50"></div>

    <div class="flex justify-between items-center mb-6 border-b border-white/20 pb-4 shrink-0">
      <h1 class="text-2xl font-mono tracking-widest text-ace-title drop-shadow-title">>> COMMUNICATION UPLINK</h1>
      <NuxtLink to="/" class="text-ace-text hover:text-ace-highlight font-mono tracking-widest text-sm">[ CANCEL &amp; RTB ]</NuxtLink>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow overflow-hidden">
      <!-- Editor Column -->
      <div class="border border-ace-border/30 p-6 bg-ace-bg/30 overflow-y-auto relative flex flex-col">
        <h2 class="text-lg font-bold mb-4 tracking-widest text-ace-highlight flex items-center shrink-0">
          <span class="w-2 h-4 bg-ace-highlight mr-2 inline-block"></span>MISSION DATA ENTRY
        </h2>

        <!-- 日付入力（既存を維持） -->
        <div class="mb-4 shrink-0">
          <label class="block text-xs font-bold text-ace-text tracking-widest mb-2">TARGET DATETIME</label>
          <div class="relative">
            <input
              ref="pickerInput"
              v-model="targetReportDate"
              type="text"
              placeholder="YYYY/MM/DD"
              class="block w-full ace-input bg-ace-bg/50 p-2 border border-ace-border focus:border-ace-highlight focus:ring-1 focus:ring-ace-highlight transition-all text-white cursor-pointer select-none"
            >
            <span class="absolute right-3 top-2.5 opacity-50 pointer-events-none text-ace-highlight">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
              </svg>
            </span>
          </div>
        </div>

        <!-- ツールバー -->
        <div class="flex items-center space-x-1 mb-2 border-b border-ace-border/30 pb-2 shrink-0 flex-wrap gap-y-1">
          <button @click="insertMarkdown('bold')" class="toolbar-btn" title="太字">B</button>
          <button @click="insertMarkdown('italic')" class="toolbar-btn" title="斜体">I</button>
          <button @click="insertMarkdown('strike')" class="toolbar-btn" title="取り消し線">S</button>
          <span class="w-px h-4 bg-ace-border/30"></span>
          <button @click="insertMarkdown('h1')" class="toolbar-btn" title="見出し1">H1</button>
          <button @click="insertMarkdown('h2')" class="toolbar-btn" title="見出し2">H2</button>
          <button @click="insertMarkdown('list')" class="toolbar-btn" title="リスト">•</button>
          <button @click="insertMarkdown('code')" class="toolbar-btn" title="コード">&lt;&gt;</button>
          <span class="w-px h-4 bg-ace-border/30"></span>
          <button @click="insertDailyTemplate" class="toolbar-btn text-ace-warning" title="日報テンプレート挿入">📋 日報</button>
          <button @click="insertWeeklyTemplate" class="toolbar-btn text-ace-warning" title="週報テンプレート挿入">📊 週報</button>
        </div>

        <!-- マークダウンエディタ -->
        <textarea
          ref="reportEditor"
          v-model="reportContent"
          @contextmenu.prevent="showContextMenu($event)"
          class="flex-grow w-full bg-ace-bg/50 border border-ace-border/50 p-4 font-sans text-sm text-ace-highlight focus:outline-none focus:border-ace-highlight resize-none whitespace-pre-wrap overflow-auto"
          spellcheck="false"
          placeholder="マークダウンで日報を記述してください..."
        ></textarea>
      </div>

      <!-- Preview Column -->
      <div class="bg-[#050c14] border border-ace-border p-6 shadow flex flex-col relative overflow-hidden">
        <!-- Scanlines effect for the display -->
        <div class="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-0 rounded"></div>

        <div class="flex items-end justify-between mb-4 border-b border-white/20 pb-0 relative z-10 w-full">
          <div class="flex space-x-1 mt-1">
            <!-- PREVIEW タブ -->
            <button
              @click="activeTab = 'preview'"
              class="px-4 py-2 font-bold tracking-widest text-xs transition-colors border border-b-0 rounded-t-sm"
              :class="activeTab === 'preview' ? 'bg-white text-black border-white' : 'bg-transparent text-ace-text border-transparent hover:bg-white/10'"
            >
              PREVIEW
            </button>

            <!-- Google Chat モードタブ -->
            <button
              @click="activeTab = 'gchat'"
              class="px-4 py-2 font-bold tracking-widest text-xs transition-colors border border-b-0 rounded-t-sm"
              :class="activeTab === 'gchat' ? 'bg-green-500 text-black border-green-500' : 'bg-transparent text-ace-text border-transparent hover:bg-white/10'"
            >
              GOOGLE CHAT
            </button>

            <!-- ACCUMULATED LOGS タブ（既存を維持） -->
            <button
              @click="activeTab = 'accumulation'"
              class="px-4 py-2 font-bold tracking-widest text-xs transition-colors border border-b-0 rounded-t-sm flex items-center"
              :class="activeTab === 'accumulation' ? 'bg-ace-highlight text-black border-ace-highlight' : 'bg-transparent text-ace-text border-transparent hover:bg-white/10'"
            >
              ACCUMULATED LOGS
            </button>
          </div>
          <div class="flex space-x-2 pb-2">
            <button v-if="activeTab === 'accumulation'" @click="saveAccumulation" class="ace-button border-ace-text text-ace-text hover:bg-ace-highlight hover:text-black hover:border-ace-highlight" :disabled="isSavingAccumulation">
              {{ isSavingAccumulation ? 'SAVING...' : 'SAVE CHANGES' }}
            </button>
            <button @click="saveProgressToTasks" class="ace-button ace-button-warning text-black hover:bg-white hover:text-black" :disabled="isDistributing">
              {{ isDistributing ? 'SAVING...' : 'SAVE TO TASKS >>' }}
            </button>
            <button v-if="activeTab === 'preview' || activeTab === 'gchat'" @click="sendWebhook" class="ace-button ace-button-primary border-white text-white hover:bg-white hover:text-black" :disabled="isSending">
              {{ isSending ? 'TRANSMITTING...' : 'INITIATE UPLINK >>' }}
            </button>
          </div>
        </div>

        <!-- PREVIEW タブ: 生テキストプレビュー -->
        <div
          v-if="activeTab === 'preview'"
          class="flex-grow overflow-y-auto font-sans text-xs whitespace-pre-wrap p-4 border border-ace-highlight/30 text-green-400 relative z-10 bg-black/50 shadow-[inset_0_0_10px_rgba(0,255,0,0.1)]"
        >{{ reportContent }}</div>

        <!-- GOOGLE CHAT タブ: Google Chat 風プレビュー -->
        <div
          v-else-if="activeTab === 'gchat'"
          class="flex-grow overflow-y-auto relative z-10 gchat-preview"
          v-html="googleChatPreviewHtml"
        ></div>

        <!-- ACCUMULATED LOGS タブ（既存を維持） -->
        <div v-else class="flex-grow flex flex-col relative z-10 w-full">
          <textarea
            v-model="accumulationText"
            class="flex-grow w-full bg-black/50 p-4 font-sans text-xs text-ace-highlight focus:outline-none focus:border-ace-highlight border border-ace-border/30 resize-none shadow-[inset_0_0_10px_rgba(0,255,0,0.1)] whitespace-pre overflow-auto"
            spellcheck="false"
            placeholder="No accumulation logs found."
          ></textarea>
        </div>

        <p v-if="successMsg" class="text-ace-highlight text-sm mt-4 font-bold tracking-widest relative z-10">{{ successMsg }}</p>
        <p v-if="errorMsg" class="text-red-400 text-sm mt-4 font-bold tracking-widest relative z-10">{{ errorMsg }}</p>
      </div>
    </div>

    <!-- カスタムコンテキストメニュー -->
    <Teleport to="body">
      <div
        v-if="contextMenu.visible"
        :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
        class="fixed z-50 glass-panel border-ace-highlight/50 py-1 min-w-[220px] shadow-[0_0_20px_rgba(52,126,177,0.4)]"
        @click.stop
      >
        <!-- プロジェクトを挿入 -->
        <div class="relative group/menu">
          <button class="ctx-menu-item w-full" @mouseenter="ctxSubmenu = 'project'">
            📁 プロジェクトを挿入 ▸
          </button>
          <div
            v-if="ctxSubmenu === 'project'"
            class="absolute left-full top-0 glass-panel border-ace-highlight/50 py-1 min-w-[200px]"
          >
            <button
              v-for="[id, proj] in Object.entries(projectsData.project)"
              :key="id"
              class="ctx-menu-item w-full"
              @click="insertProjectHeader(proj.name)"
            >
              {{ proj.name }}
            </button>
            <p v-if="Object.keys(projectsData.project).length === 0" class="px-3 py-2 text-xxs text-ace-text">
              No projects found.
            </p>
          </div>
        </div>

        <!-- タスクを挿入 -->
        <div class="relative group/menu">
          <button class="ctx-menu-item w-full" @mouseenter="ctxSubmenu = 'task'">
            📌 タスクを挿入 ▸
          </button>
          <div
            v-if="ctxSubmenu === 'task'"
            class="absolute left-full top-0 glass-panel border-ace-highlight/50 py-1 min-w-[280px] max-h-60 overflow-y-auto"
          >
            <button
              v-for="task in activeTasks"
              :key="task._file"
              class="ctx-menu-item w-full"
              @click="insertTaskLine(task)"
            >
              <span class="text-ace-warning text-xxs">[{{ task.project_name }}]</span> {{ task.title }}
            </button>
            <p v-if="activeTasks.length === 0" class="px-3 py-2 text-xxs text-ace-text">
              No active tasks found.
            </p>
          </div>
        </div>

        <hr class="border-ace-border/30 my-1" />

        <!-- GitHub Activity 挿入 -->
        <button 
          class="ctx-menu-item w-full" 
          :class="{ 'opacity-50 cursor-not-allowed': isFetchingActivity }"
          :disabled="isFetchingActivity"
          @click="insertGitHubActivity"
        >
          {{ isFetchingActivity ? '🔄 取得中...' : '🔄 GitHub Activity を挿入' }}
        </button>
      </div>
    </Teleport>
  </div>
</template>

<style>
/* flatpickr custom theme: Ace Combat 7 inspired Dark Blue */
.flatpickr-calendar {
  background: #071526 !important;
  border: 1px solid #347eb1 !important;
  box-shadow: 0 0 15px rgba(52, 126, 177, 0.4) !important;
  color: #c3e6fd !important;
  font-family: 'JetBrains Mono', 'Roboto Mono', monospace !important;
}

.flatpickr-calendar.arrowTop:after, .flatpickr-calendar.arrowTop:before {
  border-bottom-color: #347eb1 !important;
}

.flatpickr-day {
  color: #8cb4cf !important;
}

.flatpickr-day:hover, .flatpickr-day.prevMonthDay:hover, .flatpickr-day.nextMonthDay:hover {
  background: rgba(52, 126, 177, 0.3) !important;
  color: #fff !important;
}

.flatpickr-day.today {
  border-color: #c98a2c !important;
  color: #c98a2c !important;
}

.flatpickr-day.selected {
  background: #347eb1 !important;
  color: #fff !important;
  border-color: #347eb1 !important;
}

.flatpickr-months .flatpickr-month, .flatpickr-current-month .flatpickr-monthDropdown-months, .flatpickr-current-month input.cur-year {
  color: #c3e6fd !important;
  fill: #c3e6fd !important;
}

.flatpickr-current-month .flatpickr-monthDropdown-month {
  background: #071526 !important;
}

.flatpickr-weekday {
  color: #347eb1 !important;
}

.flatpickr-months .flatpickr-prev-month:hover svg, .flatpickr-months .flatpickr-next-month:hover svg {
  fill: #fff !important;
}
</style>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.css'
import { useProjects } from '~/composables/useProjects'
import { useGoogleChatMd } from '~/composables/useGoogleChatMd'
import { useGitHubREST } from '~/composables/useGitHubREST'

// ─── 既存の状態管理 ───────────────────────────────────────────────
const pickerInput = ref(null)
const webhookUrl = ref('')
const today = new Date()
const targetReportDate = ref(`${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`)
const isSending = ref(false)
const isDistributing = ref(false)
const isSavingAccumulation = ref(false)
const successMsg = ref('')
const errorMsg = ref('')
const isInitializing = ref(true)

const activeTab = ref('preview')
const accumulationText = ref('')
const activeTasks = ref([])

// ─── composables ─────────────────────────────────────────────────
const { projectsData, loadProjects } = useProjects()
const { convertToGoogleChat, renderGoogleChatPreview } = useGoogleChatMd()
const { postIssueComment, parseIssueUrl, fetchUserEvents, formatEventsAsMarkdown } = useGitHubREST()

const isFetchingActivity = ref(false)

// ─── MDエディタ ───────────────────────────────────────────────────
const reportEditor = ref(null)
const reportContent = ref('')

/**
 * ツールバーボタンによるマークダウン記法挿入
 * 太字は Google Chat 形式（*text*）を使用する
 */
const insertMarkdown = (type) => {
  const editor = reportEditor.value
  if (!editor) return

  const start = editor.selectionStart
  const end = editor.selectionEnd
  const selected = reportContent.value.substring(start, end)

  let before = '', after = ''
  switch (type) {
    case 'bold':   before = '*';  after = '*';  break  // Google Chat形式
    case 'italic': before = '_';  after = '_';  break
    case 'strike': before = '~';  after = '~';  break
    case 'h1':     before = '# ';               break
    case 'h2':     before = '## ';              break
    case 'list':   before = '- ';               break
    case 'code':   before = '`';  after = '`';  break
  }

  const insert = before + (selected || 'テキスト') + after
  reportContent.value =
    reportContent.value.substring(0, start) + insert + reportContent.value.substring(end)

  // カーソル位置を挿入後の末尾に移動
  nextTick(() => {
    editor.focus()
    const newPos = start + before.length + (selected || 'テキスト').length
    editor.setSelectionRange(newPos, newPos)
  })
}

/**
 * 日報テンプレートをカーソル位置に挿入する
 */
const insertDailyTemplate = () => {
  const dateStr = targetReportDate.value.replace(/-/g, '/')
  const template = `【日報　${dateStr}】\n\n\n以上です。`

  const editor = reportEditor.value
  if (!editor) return

  const pos = editor.selectionStart
  reportContent.value =
    reportContent.value.substring(0, pos) + template + reportContent.value.substring(pos)

  nextTick(() => {
    editor.focus()
    // カーソルを2つ目の改行（本文入力位置）に移動
    const newPos = pos + `【日報　${dateStr}】\n\n`.length
    editor.setSelectionRange(newPos, newPos)
  })
}

/**
 * 週報テンプレートをカーソル位置に挿入する（月〜金の週範囲を自動計算）
 */
const insertWeeklyTemplate = () => {
  const now = new Date(targetReportDate.value)
  const monday = new Date(now)
  monday.setDate(now.getDate() - now.getDay() + 1)
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)

  const format = (d) =>
    `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`

  const template = `【週報　${format(monday)} 〜 ${format(friday)}】\n\n\n以上です。`

  const editor = reportEditor.value
  if (!editor) return
  const pos = editor.selectionStart
  reportContent.value =
    reportContent.value.substring(0, pos) + template + reportContent.value.substring(pos)

  nextTick(() => {
    editor.focus()
    const newPos = pos + `【週報　${format(monday)} 〜 ${format(friday)}】\n\n`.length
    editor.setSelectionRange(newPos, newPos)
  })
}

// ─── Google Chat プレビュー ────────────────────────────────────────
/**
 * Google Chat 形式に変換した HTML プレビュー
 * v-html で gchat-preview コンテナ内に描画される
 */
const googleChatPreviewHtml = computed(() => {
  return renderGoogleChatPreview(reportContent.value)
})

// ─── コンテキストメニュー ─────────────────────────────────────────
const contextMenu = ref({ visible: false, x: 0, y: 0 })
const ctxSubmenu = ref('')

const showContextMenu = (event) => {
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY
  }
  ctxSubmenu.value = ''
}

/**
 * プロジェクト名をヘッダー形式でカーソル位置に挿入する
 */
const insertProjectHeader = (projectName) => {
  const editor = reportEditor.value
  if (!editor) return

  const pos = editor.selectionStart
  const insert = `*【${projectName}】*\n`

  reportContent.value =
    reportContent.value.substring(0, pos) + insert + reportContent.value.substring(pos)

  contextMenu.value.visible = false
  nextTick(() => {
    editor.focus()
    const newPos = pos + insert.length
    editor.setSelectionRange(newPos, newPos)
  })
}

/**
 * タスク名をリスト形式でカーソル位置に挿入する
 */
const insertTaskLine = (task) => {
  const editor = reportEditor.value
  if (!editor) return

  const pos = editor.selectionStart
  const insert = `　・${task.title}\n　　`

  reportContent.value =
    reportContent.value.substring(0, pos) + insert + reportContent.value.substring(pos)

  contextMenu.value.visible = false
  nextTick(() => {
    editor.focus()
    const newPos = pos + insert.length
    editor.setSelectionRange(newPos, newPos)
  })
}

/**
 * GitHub Activity を取得してエディタのカーソル位置に挿入する
 */
const insertGitHubActivity = async () => {
  const editor = reportEditor.value
  if (!editor) return

  isFetchingActivity.value = true
  contextMenu.value.visible = false

  try {
    // targetReportDate をベースに当日のイベントを取得
    const since = targetReportDate.value || new Date().toISOString().split('T')[0]
    const events = await fetchUserEvents(since)
    const markdown = formatEventsAsMarkdown(events)

    // カーソル位置に挿入
    const pos = editor.selectionStart
    reportContent.value =
      reportContent.value.substring(0, pos) + markdown + '\n' + reportContent.value.substring(pos)

    nextTick(() => {
      editor.focus()
      const newPos = pos + markdown.length + 1
      editor.setSelectionRange(newPos, newPos)
    })
  } catch (e) {
    console.error('[Report] Failed to fetch GitHub activity:', e)
    errorMsg.value = `GitHub Activity fetch failed: ${e.message}`
  } finally {
    isFetchingActivity.value = false
  }
}

// ─── Webhook 送信 ─────────────────────────────────────────────────
const sendWebhook = async () => {
  if (!webhookUrl.value) {
    errorMsg.value = 'Please provide a Webhook URL.'
    return
  }

  isSending.value = true
  successMsg.value = ''
  errorMsg.value = ''

  try {
    // Google Chat 形式に変換して送信
    const payload = convertToGoogleChat(reportContent.value)

    const response = await fetch(webhookUrl.value, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: payload })
    })

    if (response.ok) {
      successMsg.value = 'Report sent to Google Chat successfully!'

      // アキュムレーション処理（reportContent 全文を日報ログとして追記）
      if (window.electronAPI && window.electronAPI.writeAccumulation) {
        try {
          const customDir = localStorage.getItem('tasksDir') || undefined
          const today = new Date().toLocaleDateString('ja-JP', {
            year: 'numeric', month: '2-digit', day: '2-digit'
          })

          const res = await window.electronAPI.readAccumulation(customDir)
          let existing = res.success ? res.content : ''
          if (existing.trim()) existing += '\n\n'
          existing += `## 日報ログ [${today}]\n${reportContent.value}`

          await window.electronAPI.writeAccumulation(existing, customDir)
          successMsg.value = 'Report sent and successfully accumulated locally!'

          // Issue 自動コメント (FR-007)
          const autoComment = localStorage.getItem('autoCommentOnIssue') === 'true'
          if (autoComment && activeTasks.value.length > 0) {
            await postIssueComments()
          }
        } catch (e) {
          console.error('Accumulation error', e)
        }
      }
    } else {
      errorMsg.value = `Failed to send: ${response.statusText}`
    }
  } catch (err) {
    errorMsg.value = err.message
  } finally {
    isSending.value = false
  }
}

/**
 * 日報送信後に、関連する GitHub Issue に進捗コメントを投稿する
 */
const postIssueComments = async () => {
  const results = []

  for (const task of activeTasks.value) {
    // issue_url が設定されているタスク、または issue 番号が設定されているタスクのみ対象
    if (!task.issue_url && !task.issue) continue

    let issueInfo = null

    // issue_url からパース
    if (task.issue_url) {
      issueInfo = parseIssueUrl(task.issue_url)
    }

    // issue_url がない場合、デフォルトリポジトリ + issue番号から構築
    if (!issueInfo && task.issue) {
      const defaultRepo = localStorage.getItem('githubRepo') || ''
      if (defaultRepo) {
        const [owner, repo] = defaultRepo.split('/')
        if (owner && repo) {
          issueInfo = { owner, repo, number: parseInt(task.issue, 10) }
        }
      }
    }

    if (!issueInfo) continue

    // コメント本文を構築
    const dateStr = targetReportDate.value.replace(/-/g, '/')
    const commentBody = [
      `## 📋 日報 進捗更新 (${dateStr})`,
      '',
      `**タスク**: ${task.title}`,
      '',
      '---',
      '*Progress Memo App からの自動投稿*'
    ].join('\n')

    const result = await postIssueComment(
      issueInfo.owner,
      issueInfo.repo,
      issueInfo.number,
      commentBody
    )

    results.push({
      task: task.title,
      issue: `#${issueInfo.number}`,
      ...result
    })
  }

  // 結果をフィードバック
  const successCount = results.filter(r => r.success).length
  const failCount = results.filter(r => !r.success).length

  if (successCount > 0) {
    successMsg.value += ` | GitHub: ${successCount} issue(s) commented.`
  }
  if (failCount > 0) {
    const errors = results.filter(r => !r.success).map(r => `${r.task}: ${r.error}`)
    console.warn('[Report] Issue comment failures:', errors)
    errorMsg.value = `GitHub comment failed for ${failCount} issue(s). Check console.`
  }
}

// ─── アキュムレーション操作（既存を維持） ───────────────────────────
const saveAccumulation = async () => {
  if (window.electronAPI && window.electronAPI.writeAccumulation) {
    isSavingAccumulation.value = true
    successMsg.value = ''
    errorMsg.value = ''
    const customDir = localStorage.getItem('tasksDir') || undefined
    const res = await window.electronAPI.writeAccumulation(accumulationText.value, customDir)
    isSavingAccumulation.value = false
    if (res.success) {
      successMsg.value = 'Accumulation logs saved successfully!'
      setTimeout(() => {
        if (successMsg.value === 'Accumulation logs saved successfully!') successMsg.value = ''
      }, 3000)
    } else {
      errorMsg.value = 'Failed to save accumulation: ' + res.error
    }
  }
}

const loadAccumulation = async () => {
  if (window.electronAPI && window.electronAPI.readAccumulation) {
    const customDir = localStorage.getItem('tasksDir') || undefined
    const res = await window.electronAPI.readAccumulation(customDir)
    if (res.success) {
      accumulationText.value = res.content
    } else {
      console.error('Failed to load accumulation:', res.error)
    }
  }
}

watch(activeTab, (newTab) => {
  if (newTab === 'accumulation') {
    loadAccumulation()
  }
})

const saveProgressToTasks = async () => {
  if (!window.electronAPI || !window.electronAPI.distributeAccumulation) {
    errorMsg.value = 'Electron API for distribution not available.'
    return
  }

  isDistributing.value = true
  successMsg.value = ''
  errorMsg.value = ''

  try {
    if (activeTab.value === 'accumulation') {
      await saveAccumulation()
    }

    const customDir = localStorage.getItem('tasksDir') || undefined
    const res = await window.electronAPI.distributeAccumulation(customDir)

    if (res.success) {
      successMsg.value = 'Accumulated logs successfully saved to individual task files!'
      if (activeTab.value === 'accumulation') {
        accumulationText.value = ''
      }
    } else {
      errorMsg.value = `Failed to distribute: ${res.error}`
    }
  } catch (e) {
    errorMsg.value = e.message
  } finally {
    isDistributing.value = false
  }
}

// ─── 初期化処理 ──────────────────────────────────────────────────
onMounted(async () => {
  isInitializing.value = true
  console.log('[Report] Component mounted, loading settings...')

  // flatpickr 初期化（既存を維持）
  if (pickerInput.value) {
    flatpickr(pickerInput.value, {
      dateFormat: 'Y/m/d',
      defaultDate: targetReportDate.value,
      onChange: (selectedDates, dateStr) => {
        targetReportDate.value = dateStr
      }
    })
  }

  // webhook URL 復号（既存を維持）
  const savedUrl = localStorage.getItem('googleChatWebhook') || ''
  if (savedUrl) {
    if (window.electronAPI && window.electronAPI.decryptString) {
      console.log('[Report] Decrypting webhook URL...')
      webhookUrl.value = await window.electronAPI.decryptString(savedUrl)
    } else {
      webhookUrl.value = savedUrl
    }
  }

  // プロジェクト・タスクのロード（コンテキストメニュー用）
  try {
    if (window.electronAPI && window.electronAPI.getAllMarkdowns) {
      const customDir = localStorage.getItem('tasksDir') || undefined

      // useProjects composable でプロジェクトをロード
      await loadProjects()

      const allTasks = await window.electronAPI.getAllMarkdowns(customDir)
      activeTasks.value = allTasks.filter(t => t.status === 'inProgress')
    }
  } catch (err) {
    console.error('Failed to load tasks:', err)
  } finally {
    isInitializing.value = false
    console.log('[Report] Initialization complete.')
  }

  // メニュー外クリックでコンテキストメニューを閉じる
  document.addEventListener('click', () => {
    contextMenu.value.visible = false
    ctxSubmenu.value = ''
  })
})

// webhook URL の変更を暗号化して保存（既存を維持）
watch(webhookUrl, async (newVal) => {
  if (isInitializing.value) return

  let finalUrl = newVal
  if (window.electronAPI && window.electronAPI.encryptString) {
    finalUrl = await window.electronAPI.encryptString(newVal)
  }
  localStorage.setItem('googleChatWebhook', finalUrl)
})
</script>
