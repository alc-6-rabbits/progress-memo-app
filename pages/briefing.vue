<template>
  <div class="p-8 h-full glass-panel relative flex flex-col overflow-hidden font-mono">
    <!-- 装飾コーナー -->
    <div class="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-ace-highlight m-4 opacity-50"></div>
    <div class="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-ace-highlight m-4 opacity-50"></div>

    <!-- ヘッダー -->
    <div class="flex justify-between items-center mb-6 border-b border-white/20 pb-4 shrink-0">
      <h1 class="text-2xl font-mono tracking-widest text-ace-title drop-shadow-title">>> MISSION BRIEFING</h1>
      <div class="flex items-center space-x-4">
        <span class="text-xs text-ace-text">{{ currentDateTime }}</span>
        <button @click="refreshAll" class="ace-button ace-button-primary text-xxs" :disabled="isLoading">
          {{ isLoading ? 'SYNCING...' : 'REFRESH' }}
        </button>
      </div>
    </div>

    <!-- メインコンテンツ（3セクション） -->
    <div class="flex-grow overflow-y-auto space-y-6">

      <!-- ===== ALERTS セクション ===== -->
      <div v-if="alerts.length > 0" class="border border-red-500/50 bg-red-900/10 p-4">
        <h2 class="text-sm font-bold tracking-widest text-red-400 flex items-center mb-3">
          <span class="w-2 h-4 bg-red-500 mr-2 inline-block animate-pulse"></span>⚠ ALERTS ({{ alerts.length }})
        </h2>
        <div class="space-y-2">
          <div v-for="alert in alerts" :key="alert.id"
               class="flex items-center justify-between text-xs px-3 py-2 border-l-2"
               :class="alert.scheduleStatus === 'overdue' ? 'border-red-500 bg-red-900/20' : 'border-yellow-500 bg-yellow-900/10'">
            <div>
              <span class="text-ace-warning mr-2">[{{ alert.repository || alert.projectTitle }}]</span>
              <span v-if="alert.number" class="text-ace-text mr-1">#{{ alert.number }}</span>
              <span class="text-white">{{ alert.title }}</span>
            </div>
            <div>
              <span v-if="alert.scheduleStatus === 'overdue'" class="text-red-400 font-bold tracking-widest">OVERDUE</span>
              <span v-else class="text-yellow-400 font-bold tracking-widest">AT RISK</span>
              <span class="text-ace-text ml-2">Due: {{ alert.dueDate }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== 2カラムレイアウト: LOCAL + GITHUB ===== -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- LOCAL OPERATIONS セクション -->
        <div class="border border-ace-border/30 p-4 bg-ace-bg/30">
          <h2 class="text-sm font-bold tracking-widest text-ace-highlight flex items-center mb-4">
            <span class="w-2 h-4 bg-ace-highlight mr-2 inline-block"></span>LOCAL OPERATIONS
            <span class="ml-2 text-xxs text-ace-text">({{ localInProgressTasks.length }})</span>
          </h2>

          <div v-if="localInProgressTasks.length === 0" class="text-xs text-ace-text py-4 text-center">
            No active local tasks.
          </div>
          <div v-else class="space-y-1">
            <div v-for="task in localInProgressTasks" :key="task._file"
                 class="flex items-center text-xs py-2 px-2 hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-ace-highlight">
              <span class="text-ace-warning w-32 truncate shrink-0">[{{ task.project_name || 'Inbox' }}]</span>
              <span class="text-white flex-grow truncate">{{ task.title }}</span>
              <span v-if="task.issue" class="text-ace-text ml-2">#{{ task.issue }}</span>
            </div>
          </div>
        </div>

        <!-- GITHUB OPERATIONS セクション -->
        <div class="border border-ace-border/30 p-4 bg-ace-bg/30">
          <h2 class="text-sm font-bold tracking-widest text-ace-highlight flex items-center mb-4">
            <span class="w-2 h-4 bg-ace-highlight mr-2 inline-block"></span>GITHUB OPERATIONS
            <span class="ml-2 text-xxs text-ace-text">({{ githubActiveItems.length }})</span>
          </h2>

          <!-- PAT未設定時 -->
          <div v-if="!hasPat" class="text-xs text-ace-text py-4 text-center">
            GitHub PAT is not configured.
            <NuxtLink to="/settings" class="text-ace-highlight underline ml-1">Configure in SETTINGS</NuxtLink>
          </div>

          <!-- ローディング中 -->
          <div v-else-if="githubLoading" class="text-xs text-ace-highlight py-4 text-center animate-pulse tracking-widest">
            SYNCING GITHUB DATALINK...
          </div>

          <!-- エラー時 -->
          <div v-else-if="githubError" class="text-xs text-red-400 py-4 text-center">
            {{ githubError }}
          </div>

          <!-- データ表示 -->
          <div v-else class="space-y-1">
            <div v-if="githubActiveItems.length === 0" class="text-xs text-ace-text py-4 text-center">
              No active GitHub items found.
            </div>
            <div v-for="item in githubActiveItems" :key="item.id"
                 class="flex items-center text-xs py-2 px-2 hover:bg-white/5 transition-colors border-l-2"
                 :class="{
                   'border-red-500': item.scheduleStatus === 'overdue',
                   'border-yellow-500': item.scheduleStatus === 'at-risk',
                   'border-transparent': item.scheduleStatus !== 'overdue' && item.scheduleStatus !== 'at-risk'
                 }">
              <span class="text-ace-warning w-32 truncate shrink-0">[{{ item.repository.split('/')[1] || item.projectTitle }}]</span>
              <span class="text-ace-text mr-1">#{{ item.number }}</span>
              <span class="text-white flex-grow truncate">{{ item.title }}</span>
              <span class="shrink-0 ml-2 px-1.5 py-0.5 text-xxs font-bold tracking-widest border"
                    :class="statusBadgeClass(item.status)">
                {{ item.status || 'N/A' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== SUMMARY セクション ===== -->
      <div v-if="githubAllItems.length > 0" class="border border-ace-border/30 p-4 bg-ace-bg/30">
        <h2 class="text-sm font-bold tracking-widest text-ace-highlight flex items-center mb-3">
          <span class="w-2 h-4 bg-ace-highlight mr-2 inline-block"></span>STATUS OVERVIEW
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center py-3 border border-ace-border/30 bg-ace-bg/50">
            <div class="text-2xl font-bold text-ace-text">{{ statusCounts.todo }}</div>
            <div class="text-xxs tracking-widest text-ace-text mt-1">TODO</div>
          </div>
          <div class="text-center py-3 border border-ace-border/30 bg-ace-bg/50">
            <div class="text-2xl font-bold text-ace-highlight">{{ statusCounts.inProgress }}</div>
            <div class="text-xxs tracking-widest text-ace-text mt-1">IN PROGRESS</div>
          </div>
          <div class="text-center py-3 border border-ace-border/30 bg-ace-bg/50">
            <div class="text-2xl font-bold text-green-400">{{ statusCounts.done }}</div>
            <div class="text-xxs tracking-widest text-ace-text mt-1">DONE</div>
          </div>
          <div class="text-center py-3 border border-red-500/30 bg-red-900/10">
            <div class="text-2xl font-bold text-red-400">{{ statusCounts.overdue }}</div>
            <div class="text-xxs tracking-widest text-red-400 mt-1">OVERDUE</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGitHubGraphQL } from '~/composables/useGitHubGraphQL'

// ─── composables ──────────────────────────────────────────
const { fetchAllProjectItems, invalidateCache, loading: githubLoading, error: githubError } = useGitHubGraphQL()

// ─── 状態管理 ─────────────────────────────────────────────
const isLoading = ref(false)
const localTasks = ref([])
const githubAllItems = ref([])
const hasPat = ref(false)

// ─── 現在日時（ヘッダー表示用） ────────────────────────────
const currentDateTime = computed(() => {
  const now = new Date()
  return now.toLocaleString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
})

// ─── 算出プロパティ ──────────────────────────────────────
const localInProgressTasks = computed(() => {
  return localTasks.value.filter(t => t.status === 'inProgress')
})

const githubActiveItems = computed(() => {
  return githubAllItems.value.filter(i => {
    // Status が明示的に "Done" のアイテムのみ除外する
    // Status が未設定 (null) のアイテムはアクティブとして扱う
    if (!i.status) return true
    return i.status.toLowerCase() !== 'done'
  })
})

const alerts = computed(() => {
  return githubAllItems.value.filter(i =>
    i.scheduleStatus === 'overdue' || i.scheduleStatus === 'at-risk'
  ).sort((a, b) => {
    // overdue を先に、次に at-risk
    if (a.scheduleStatus === 'overdue' && b.scheduleStatus !== 'overdue') return -1
    if (a.scheduleStatus !== 'overdue' && b.scheduleStatus === 'overdue') return 1
    return new Date(a.dueDate) - new Date(b.dueDate)
  })
})

const statusCounts = computed(() => {
  const counts = { todo: 0, inProgress: 0, done: 0, overdue: 0 }
  githubAllItems.value.forEach(item => {
    const s = (item.status || '').toLowerCase()
    if (s === 'done') counts.done++
    else if (s === 'in progress') counts.inProgress++
    else if (s === 'todo') counts.todo++

    if (item.scheduleStatus === 'overdue') counts.overdue++
  })
  return counts
})

// ─── ヘルパー ─────────────────────────────────────────────
const statusBadgeClass = (status) => {
  const s = (status || '').toLowerCase()
  if (s === 'done') return 'border-green-500 text-green-400'
  if (s === 'in progress') return 'border-ace-highlight text-ace-highlight'
  if (s === 'todo') return 'border-ace-text text-ace-text'
  return 'border-ace-border text-ace-text'
}

// ─── データ取得 ───────────────────────────────────────────
const refreshAll = async () => {
  isLoading.value = true
  invalidateCache()
  await loadLocalTasks()
  await loadGitHubData()
  isLoading.value = false
}

const loadLocalTasks = async () => {
  try {
    if (window.electronAPI && window.electronAPI.getAllMarkdowns) {
      const customDir = localStorage.getItem('tasksDir') || undefined
      localTasks.value = await window.electronAPI.getAllMarkdowns(customDir)
    }
  } catch (e) {
    console.error('[Briefing] Failed to load local tasks:', e)
  }
}

const loadGitHubData = async () => {
  if (!hasPat.value) return
  try {
    githubAllItems.value = await fetchAllProjectItems()
  } catch (e) {
    console.error('[Briefing] Failed to load GitHub data:', e)
  }
}

// ─── 初期化 ───────────────────────────────────────────────
onMounted(async () => {
  // PAT の存在確認
  const savedPat = localStorage.getItem('githubPat') || ''
  hasPat.value = !!savedPat

  isLoading.value = true
  await loadLocalTasks()
  await loadGitHubData()
  isLoading.value = false
})
</script>
