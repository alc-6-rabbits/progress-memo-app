<template>
  <div class="p-8 h-full glass-panel relative flex flex-col overflow-hidden font-mono">
    <!-- 装飾コーナー -->
    <div class="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-ace-highlight m-4 opacity-50"></div>
    <div class="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-ace-highlight m-4 opacity-50"></div>

    <!-- ヘッダー -->
    <div class="flex justify-between items-center mb-6 border-b border-white/20 pb-4 shrink-0">
      <h1 class="text-2xl font-mono tracking-widest text-ace-title drop-shadow-title">>> OPERATION TIMELINE</h1>
      <div class="flex items-center space-x-4">
        <!-- 時間範囲ナビゲーション -->
        <div class="flex items-center space-x-2">
          <button @click="shiftView(-shiftStep)" class="ace-button text-xxs border-ace-text text-ace-text hover:bg-ace-highlight hover:text-ace-bg px-2 py-1">◄ PREV</button>
          <span class="text-xs text-ace-highlight min-w-[140px] text-center">{{ viewRangeLabel }}</span>
          <button @click="resetView" class="ace-button text-xxs border-ace-warning text-ace-warning hover:bg-ace-warning hover:text-ace-bg px-2 py-1">TODAY</button>
          <button @click="shiftView(shiftStep)" class="ace-button text-xxs border-ace-text text-ace-text hover:bg-ace-highlight hover:text-ace-bg px-2 py-1">NEXT ►</button>
        </div>

        <!-- 表示モード切替 -->
        <div class="flex items-center border border-ace-border/30 bg-ace-bg/50 p-0.5">
          <button @click="viewMode = 'weekly'" 
                  :class="viewMode === 'weekly' ? 'bg-ace-highlight text-ace-bg shadow-[0_0_8px_rgba(195,230,253,0.5)]' : 'text-ace-text hover:text-white'"
                  class="text-[10px] px-3 py-1 transition-all uppercase tracking-wider font-bold">WEEKLY</button>
          <button @click="viewMode = 'monthly'" 
                  :class="viewMode === 'monthly' ? 'bg-ace-highlight text-ace-bg shadow-[0_0_8px_rgba(195,230,253,0.5)]' : 'text-ace-text hover:text-white'"
                  class="text-[10px] px-3 py-1 transition-all uppercase tracking-wider font-bold">MONTHLY</button>
        </div>

        <!-- フィルター -->
        <select v-if="githubProjects.length > 1" 
                v-model="selectedProject"
                class="bg-ace-bg/80 border border-ace-border text-ace-text text-xxs px-2 py-1 outline-none font-mono">
          <option value="">ALL PROJECTS</option>
          <option v-for="proj in githubProjects" :key="proj" :value="proj">{{ proj }}</option>
        </select>

        <button @click="refreshData" class="ace-button ace-button-primary text-xxs" :disabled="isLoading">
          {{ isLoading ? 'SYNCING...' : 'REFRESH' }}
        </button>
      </div>
    </div>

    <!-- ガントチャート メインコンテンツ -->
    <div v-if="!hasPat" class="flex-grow flex items-center justify-center">
      <div class="text-center text-ace-text">
        <p class="text-sm mb-2">GitHub PAT is not configured.</p>
        <NuxtLink to="/settings" class="text-ace-highlight underline">Configure in SETTINGS</NuxtLink>
      </div>
    </div>

    <div v-else-if="isLoading" class="flex-grow flex items-center justify-center">
      <p class="text-sm text-ace-highlight animate-pulse tracking-widest">LOADING TIMELINE DATA...</p>
    </div>

    <div v-else class="flex-grow overflow-auto relative scrollbar-custom">
      <!-- ガントチャートテーブル -->
      <div class="gantt-wrapper" :style="{ minWidth: totalDays * dayWidth + labelWidth + 'px' }">

        <!-- 日付ヘッダー行 -->
        <div class="gantt-header flex sticky top-0 z-20 bg-ace-bg/95">
          <div class="gantt-label-col shrink-0 border-b border-r border-ace-border/30 p-2 bg-ace-bg sticky left-0 z-30"
               :style="{ width: labelWidth + 'px' }">
            <span class="text-xxs text-ace-text tracking-widest whitespace-nowrap">MISSION TARGETS</span>
          </div>
          <div class="flex relative">
            <div v-for="(date, idx) in dateRange" :key="idx"
                 class="gantt-date-cell text-center border-b border-r border-ace-border/10 py-1 flex flex-col justify-center"
                 :style="{ width: dayWidth + 'px' }"
                 :class="{
                   'bg-ace-panel/30': isWeekend(date),
                   'border-b-ace-warning border-b-2': isToday(date)
                 }">
              <!-- 月変わり目のみ月名表示 -->
              <div v-if="shouldShowMonthLabel(date, idx)" class="text-[9px] text-ace-highlight font-bold leading-none mb-0.5">
                {{ date.getMonth() + 1 }}月
              </div>
              <div v-if="shouldShowDayLabel(idx)" class="text-xxs leading-none" :class="isToday(date) ? 'text-ace-warning font-bold' : 'text-ace-text'">
                {{ date.getDate() }}
              </div>
              <div v-if="viewMode === 'weekly'" class="text-[8px] leading-tight" :class="isWeekend(date) ? 'text-ace-text/30' : 'text-ace-text/50'">
                {{ dayNames[date.getDay()] }}
              </div>
            </div>
          </div>
        </div>

        <!-- プロジェクト別グループ + アイテム行 -->
        <div v-for="group in groupedTimelineItems" :key="group.project">
          <!-- プロジェクトヘッダー -->
          <div class="flex border-b border-ace-border/20 bg-ace-panel/20">
            <div class="gantt-label-col shrink-0 border-r border-ace-border/20 p-2 flex items-center bg-ace-bg sticky left-0 z-20"
                 :style="{ width: labelWidth + 'px' }">
              <span class="text-xxs text-ace-warning font-bold tracking-widest truncate">
                >> {{ group.project }}
              </span>
            </div>
            <div class="flex-grow" :style="{ width: totalDays * dayWidth + 'px' }"></div>
          </div>

          <!-- アイテム行 -->
          <div v-for="item in group.items" :key="item.id" class="flex gantt-row hover:bg-white/3 transition-colors relative">
            <!-- ラベル列 (Sticky Left) -->
            <div class="gantt-label-col shrink-0 border-r border-b border-ace-border/10 p-2 flex items-center cursor-pointer hover:bg-white/5 sticky left-0 z-20 bg-ace-bg"
                 :style="{ width: labelWidth + 'px' }"
                 @click="openInBrowser(item.url)">
              <span class="text-ace-text text-xxs mr-1 shrink-0">#{{ item.number }}</span>
              <span class="text-xs text-white truncate font-sans">{{ item.title }}</span>
            </div>

            <!-- バー列 -->
            <div class="flex relative border-b border-ace-border/5" :style="{ width: totalDays * dayWidth + 'px' }">
              <!-- 背景のグリッドライン -->
              <div v-for="(date, idx) in dateRange" :key="idx"
                   class="absolute top-0 bottom-0 border-r border-ace-border/5"
                   :class="{ 'bg-ace-panel/10': isWeekend(date) }"
                   :style="{ left: idx * dayWidth + 'px', width: dayWidth + 'px' }">
              </div>

              <!-- 今日ライン -->
              <div v-if="todayOffset >= 0 && todayOffset < totalDays"
                   class="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 opacity-70"
                   :style="{ left: (todayOffset * dayWidth + dayWidth / 2) + 'px' }">
              </div>

              <!-- ガントバー -->
              <div v-if="item.startDate && item.dueDate"
                   class="gantt-bar absolute top-1 bottom-1 rounded-sm z-10 cursor-pointer flex items-center justify-center border border-white/10"
                   :class="ganttBarClass(item)"
                   :style="ganttBarStyle(item)"
                   @click="openInBrowser(item.url)">
                <span v-if="barWidthDays(item) >= 3" class="text-[9px] text-white truncate px-1 drop-shadow-sm font-sans tracking-tight">
                  {{ item.title }}
                </span>
              </div>

              <!-- 日程未設定マーク -->
              <div v-else class="absolute top-2 text-[10px] text-ace-text/30 italic px-2">
                [ NOT DEPLOYED ]
              </div>
            </div>
          </div>
        </div>

        <!-- アイテムなし -->
        <div v-if="filteredItems.length === 0" class="text-center py-12 text-ace-text text-xs tracking-widest border border-ace-border/10 m-4 bg-ace-panel/10">
          SYSTEM ERROR: NO TIMELINE SIGNALS DETECTED.
        </div>
      </div>
    </div>

    <!-- 凡例 -->
    <div class="shrink-0 mt-4 pt-4 border-t border-ace-border/30 flex items-center space-x-8 text-[10px] tracking-widest font-bold">
      <span class="flex items-center text-ace-highlight"><span class="w-4 h-2 bg-[#347eb1] mr-2 inline-block"></span> ON TRACK</span>
      <span class="flex items-center text-ace-warning"><span class="w-4 h-2 bg-[#c98a2c] mr-2 inline-block"></span> AT RISK</span>
      <span class="flex items-center text-red-400"><span class="w-4 h-2 bg-[#ef4444] mr-2 inline-block animate-pulse"></span> OVERDUE</span>
      <span class="flex items-center text-green-400"><span class="w-4 h-2 bg-[#22c55e] mr-2 inline-block opacity-50"></span> COMPLETED</span>
      <span class="flex items-center text-red-500"><span class="w-4 h-0.5 bg-red-500 mr-2 inline-block"></span> TODAY</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGitHubGraphQL } from '~/composables/useGitHubGraphQL'

// ─── composables ──────────────────────────────────────────
const { fetchAllProjectItems, invalidateCache, loading: githubLoading, error: githubError } = useGitHubGraphQL()

// ─── 定数・設定 ───────────────────────────────────────
const viewMode = ref('weekly') // 'weekly' | 'monthly'
const labelWidth = 240    // ラベル列の幅 (px)
const dayNames = ['日', '月', '火', '水', '木', '金', '土']

const viewDays = computed(() => {
  return viewMode.value === 'weekly' ? 42 : 112 // 6週間 or 16週間
})

const dayWidth = computed(() => {
  return viewMode.value === 'weekly' ? 40 : 15 // 広め vs 狭め
})

const shiftStep = computed(() => {
  return viewMode.value === 'weekly' ? 7 : 28 // 1週間 or 4週間
})

// ─── 状態管理 ─────────────────────────────────────────────
const isLoading = ref(false)
const hasPat = ref(false)
const githubItems = ref([])
const viewOffset = ref(0)   // 今日からのオフセット日数
const selectedProject = ref('')

// ─── 表示範囲の算出 ──────────────────────────────────────
const viewStartDate = computed(() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  // 起点を2週間前に固定し、offsetでずらす
  d.setDate(d.getDate() + viewOffset.value - 14)
  return d
})

const totalDays = computed(() => viewDays.value)

const dateRange = computed(() => {
  const dates = []
  for (let i = 0; i < viewDays.value; i++) {
    const d = new Date(viewStartDate.value)
    d.setDate(d.getDate() + i)
    dates.push(d)
  }
  return dates
})

const viewRangeLabel = computed(() => {
  if (dateRange.value.length === 0) return ''
  const start = dateRange.value[0]
  const end = dateRange.value[dateRange.value.length - 1]
  const fmt = (d) => `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
  return `${fmt(start)} — ${fmt(end)}`
})

const todayOffset = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((today - viewStartDate.value) / (1000 * 60 * 60 * 24))
})

// ヘッダー用ヘルパー
const shouldShowMonthLabel = (date, idx) => {
  if (viewMode.value === 'weekly') {
    return idx === 0 || date.getDate() === 1
  } else {
    // Monthlyモードでは月が変わるとき、または最初
    return idx === 0 || date.getDate() === 1
  }
}

const shouldShowDayLabel = (idx) => {
  if (viewMode.value === 'weekly') return true
  // Monthlyモードでは7日おき、または最初
  return idx === 0 || idx % 7 === 0
}

// ─── ナビゲーション ──────────────────────────────────────
const shiftView = (days) => {
  viewOffset.value += days
}

const resetView = () => {
  viewOffset.value = 0
}

// ─── データ処理 ───────────────────────────────────────────
const githubProjects = computed(() => {
  const projects = new Set()
  githubItems.value.forEach(item => {
    if (item.projectTitle) projects.add(item.projectTitle)
  })
  return Array.from(projects).sort()
})

const filteredItems = computed(() => {
  let items = githubItems.value
  if (selectedProject.value) {
    items = items.filter(i => i.projectTitle === selectedProject.value)
  }
  return items
})

const groupedTimelineItems = computed(() => {
  const groups = {}
  // 全アイテムを対象に、開始日が入っているものを優先してソート
  const sorted = [...filteredItems.value].sort((a, b) => {
    if (a.startDate && !b.startDate) return -1
    if (!a.startDate && b.startDate) return 1
    if (a.startDate && b.startDate) {
      return new Date(a.startDate) - new Date(b.startDate)
    }
    return 0
  })

  for (const item of sorted) {
    const key = item.repository?.split('/')[1] || item.projectTitle || 'UNCLASSIFIED'
    if (!groups[key]) groups[key] = { project: key, items: [] }
    groups[key].items.push(item)
  }

  return Object.values(groups).sort((a, b) => a.project.localeCompare(b.project))
})

// ─── ガントバーの算出 ─────────────────────────────────────
const daysBetween = (d1, d2) => {
  const t1 = new Date(d1).setHours(0,0,0,0)
  const t2 = new Date(d2).setHours(0,0,0,0)
  return Math.round((t2 - t1) / (1000 * 60 * 60 * 24))
}

const barWidthDays = (item) => {
  if (!item.startDate || !item.dueDate) return 0
  return daysBetween(item.startDate, item.dueDate) + 1
}

const ganttBarStyle = (item) => {
  if (!item.startDate || !item.dueDate) return { display: 'none' }

  const startOffset = daysBetween(viewStartDate.value, item.startDate)
  const duration = barWidthDays(item)

  // 表示範囲内にクリップ
  const visibleStart = Math.max(0, startOffset)
  const visibleEnd = Math.min(viewDays.value, startOffset + duration)
  const visibleDuration = visibleEnd - visibleStart

  if (visibleDuration <= 0) return { display: 'none' }  // 範囲外

  return {
    left: (visibleStart * dayWidth.value) + 'px',
    width: (visibleDuration * dayWidth.value - 2) + 'px'  // 2px margin for visual gap
  }
}

const ganttBarClass = (item) => ({
  'gantt-bar--on-track': item.scheduleStatus === 'on-track',
  'gantt-bar--at-risk': item.scheduleStatus === 'at-risk',
  'gantt-bar--overdue': item.scheduleStatus === 'overdue',
  'gantt-bar--completed': item.scheduleStatus === 'completed'
})

// ─── ヘルパー ─────────────────────────────────────────────
const isToday = (date) => {
  const today = new Date()
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear()
}

const isWeekend = (date) => {
  const day = date.getDay()
  return day === 0 || day === 6
}

const openInBrowser = (url) => {
  if (url && window.electronAPI && window.electronAPI.openExternal) {
    window.electronAPI.openExternal(url)
  } else if (url) {
    window.open(url, '_blank')
  }
}

// ─── データ取得 ───────────────────────────────────────────
const refreshData = async () => {
  isLoading.value = true
  invalidateCache()
  if (hasPat.value) {
    try {
      githubItems.value = await fetchAllProjectItems()
    } catch (e) {
      console.error('[Timeline] Failed to load data:', e)
    }
  }
  isLoading.value = false
}

// ─── 初期化 ───────────────────────────────────────────────
onMounted(async () => {
  const savedPat = localStorage.getItem('githubPat') || ''
  hasPat.value = !!savedPat
  await refreshData()
})
</script>

<style scoped>
.scrollbar-custom::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.scrollbar-custom::-webkit-scrollbar-track {
  background: rgba(7, 21, 38, 0.5);
}
.scrollbar-custom::-webkit-scrollbar-thumb {
  background: rgba(52, 126, 177, 0.5);
  border-radius: 4px;
}
.scrollbar-custom::-webkit-scrollbar-thumb:hover {
  background: rgba(52, 126, 177, 0.8);
}

.gantt-wrapper {
  user-select: none;
}
</style>
