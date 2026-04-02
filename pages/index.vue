<template>
  <div class="h-full w-full flex flex-col p-6 gap-4 overflow-hidden relative font-mono text-tcc-text">
    
    <!-- PROJECT SELECTOR -->
    <div class="flex-none flex items-center border border-tcc-border/30 bg-tcc-panel/40 overflow-hidden overflow-x-auto custom-scrollbar">
      <div class="px-3 py-1 bg-tcc-border/20 text-[10px] font-bold tracking-widest text-tcc-hi border-r border-tcc-border/30 uppercase flex-none">Project Filter</div>
      <div class="pj-tab flex-none" :class="{ 'active': selectedProject === 'ALL UNITS' }" @click="selectedProject = 'ALL UNITS'">
        ALL UNITS
      </div>
      <div v-for="proj in uniqueProjects" :key="proj" class="pj-tab flex-none" :class="{ 'active': selectedProject === proj }" @click="selectedProject = proj">
        {{ proj }}
      </div>
      <div class="ml-auto px-4 text-[10px] text-tcc-hi font-bold italic animate-pulse flex-none">>> LIVE OPERATION DATA</div>
    </div>

    <!-- ALERT BANNER -->
    <div v-if="overdueTasks.length > 0" class="flex-none flex items-center gap-4 border border-tcc-critical bg-tcc-critical/10 px-4 py-2 relative overflow-hidden animate-pulse">
        <div class="absolute left-0 top-0 bottom-0 w-1 bg-tcc-critical"></div>
        <span class="bg-tcc-critical text-white px-3 py-0.5 text-[11px] font-bold tracking-widest">⚠ SYSTEM ALERT</span>
        <span class="text-tcc-critical text-[11px] font-bold tracking-[0.2em] uppercase glow-red flex-grow">
           Critical Deadlines detected // {{ overdueTasks.length }} targets overdue or at risk
        </span>
    </div>

    <!-- TOP ROW: 3 COLUMNS -->
    <div class="flex-none flex gap-4 h-[25%] min-h-[160px]">
      <!-- DAILY ITINERARY -->
      <div class="bracket-box p-4 flex flex-col flex-1 overflow-hidden" style="background: rgba(0, 180, 255, 0.05);">
        <p class="text-[11px] text-tcc-hi tracking-widest border-b border-tcc-border/30 pb-0.5 mb-2 flex justify-between items-center font-bold">
          <span>ITINERARY</span><span class="text-[9px] opacity-50">G-CAL: OFFLINE</span>
        </p>
        <div class="flex-grow overflow-y-auto custom-scrollbar pr-1 space-y-1.5 text-[12px]">
          <div class="flex gap-2 items-center opacity-50"><span class="w-12">--:--</span><span class="flex-grow truncate py-0.5 border-l border-tcc-border/40 pl-2">NO EVENTS SCHEDULED</span></div>
        </div>
      </div>
      <!-- DATALINK FEED -->
      <div class="bracket-box p-4 flex flex-col flex-1 overflow-hidden" style="background: rgba(0, 180, 255, 0.05);">
        <p class="text-[11px] text-tcc-hi tracking-widest border-b border-tcc-border/30 pb-0.5 mb-2 font-bold flex justify-between">
           <span>DATALINK FEED</span>
           <span v-if="pending" class="text-[9px] animate-pulse">SCANNING...</span>
        </p>
        <div class="flex-grow overflow-y-auto custom-scrollbar text-[11px] space-y-2 pr-1">
          <div v-for="(task, idx) in recentTasks" :key="idx" @click="openTask(task)" class="truncate border-l-2 py-0.5 pl-2 cursor-pointer hover:bg-tcc-hi/10" :class="[idx === 0 ? 'text-tcc-hi border-tcc-hi/40 bg-tcc-hi/5' : 'text-tcc-text border-transparent opacity-70 hover:opacity-100']">
            {{ formatTimeOnly(task.updated_at) }} [ {{ task.title }} ]
          </div>
        </div>
      </div>
      <!-- OPERATIONAL INTEL -->
      <div class="bracket-box p-4 flex flex-col flex-1 overflow-hidden" style="background: rgba(0, 180, 255, 0.05);">
        <p class="text-[11px] text-tcc-hi tracking-widest border-b border-tcc-border/30 pb-0.5 mb-2 font-bold">OPERATIONAL INTEL</p>
        <div class="flex-grow flex flex-col justify-center gap-3">
          <div class="flex justify-between text-[12px]"><span class="opacity-70">ACTIVE TARGETS</span><span class="text-tcc-hi font-bold">{{ tasksInProgress.length }}</span></div>
          <div class="flex justify-between text-[12px]"><span class="opacity-70">COMPLETION RATE</span><span class="text-green-400 font-bold">{{ completionRate }}%</span></div>
          <div class="flex-grow flex items-center justify-center border border-tcc-border/10 bg-black/30 italic text-[11px] text-tcc-text/40">
            [ MCP EXTENSION SLOT ]
          </div>
        </div>
      </div>
    </div>

    <!-- BOTTOM ROW: BOARD vs TIMELINE -->
    <div class="flex-grow flex gap-4 min-h-0">
      
      <!-- LEFT: TASK BOARD -->
      <div class="flex-[3] bracket-box p-4 flex flex-col overflow-hidden" style="background: rgba(0, 180, 255, 0.07);">
        <div class="flex justify-between items-center border-b border-tcc-border/30 pb-1 mb-4">
           <p class="text-[11px] text-tcc-hi tracking-widest uppercase font-bold">Task Strategic Board</p>
           <NuxtLink to="/tasks" class="text-[10px] text-tcc-hi hover:text-white underline transition-colors cursor-pointerglow-blue">FULL BOARD ▶</NuxtLink>
        </div>
        <div class="flex-grow flex flex-row overflow-x-auto custom-scrollbar gap-4 pb-1">
          
          <!-- TODO -->
          <div class="flex flex-col min-w-[200px] flex-1">
             <div class="text-[11px] font-bold text-gray-400 border-b border-gray-600/30 mb-3 px-2 flex justify-between"><span>TODO</span><span>({{ tasksTodo.length }})</span></div>
             <div class="flex-grow overflow-y-auto custom-scrollbar pr-1 space-y-2">
                <div v-for="task in tasksTodo" :key="task.id" @click="openTask(task)" class="task-card cursor-pointer">
                   <div class="flex justify-between items-center mb-1.5"><span class="text-[10px] font-bold text-gray-500 truncate pr-2">{{ task.project_name || 'UNCLASSIFIED' }}</span><span v-if="task.priority" class="tag flex-none" :class="'badge-' + task.priority.toLowerCase()">{{ task.priority.toUpperCase() }}</span></div>
                   <div class="text-[12px] text-gray-300 font-bold leading-snug">{{ task.title }}</div>
                </div>
             </div>
          </div>
          
          <!-- IN PROGRESS -->
          <div class="flex flex-col min-w-[220px] flex-1 bg-tcc-hi/5 border-x border-tcc-hi/10 px-1">
             <div class="text-[11px] font-bold text-tcc-hi border-b border-tcc-hi/30 mb-3 px-2 flex justify-between"><span>ENGAGED</span><span>({{ tasksInProgress.length }})</span></div>
             <div class="flex-grow overflow-y-auto custom-scrollbar pr-1 space-y-2">
                <div v-for="task in tasksInProgress" :key="task.id" @click="openTask(task)" class="task-card border-tcc-hi/40 relative cursor-pointer hover:border-tcc-hi">
                   <div class="absolute left-0 top-0 bottom-0 w-1 bg-tcc-hi glow-blue"></div>
                   <div class="flex justify-between items-center mb-1.5 pl-2"><span class="text-[10px] font-bold text-tcc-hi truncate pr-2">{{ task.project_name || 'UNCLASSIFIED' }}</span><span v-if="task.priority" class="tag flex-none" :class="'badge-' + (task.priority || 'medium').toLowerCase()">{{ (task.priority || 'MEDIUM').toUpperCase() }}</span></div>
                   <div class="text-[12px] text-white font-bold leading-snug pl-2">{{ task.title }}</div>
                </div>
             </div>
          </div>
          
          <!-- DONE -->
          <div class="flex flex-col min-w-[200px] flex-1">
             <div class="text-[11px] font-bold text-green-500/70 border-b border-green-900/30 mb-3 px-2 flex justify-between"><span>COMPLETED</span><span>({{ tasksDone.length }})</span></div>
             <div class="flex-grow overflow-y-auto custom-scrollbar pr-1 opacity-60 space-y-2">
                <div v-for="task in tasksDone" :key="task.id" @click="openTask(task)" class="task-card cursor-pointer hover:opacity-100 transition-opacity">
                   <div class="text-[11px] text-tcc-text truncate">{{ task.title }}</div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <!-- RIGHT: TACTICAL TIMELINE (Restored Gantt) -->
      <div class="flex-[2] bracket-box p-4 flex flex-col overflow-hidden" style="background: rgba(0, 180, 255, 0.05);">
        <div class="flex justify-between items-center border-b border-tcc-border/30 pb-1 mb-2">
          <p class="text-[11px] text-tcc-hi tracking-widest uppercase font-bold">Tactical Timeline</p>
          <div class="flex gap-4 text-[10px] text-tcc-hi/70 font-bold items-center">
            <button @click="changeWeek(-1)" class="hover:text-tcc-hi px-2 py-0.5 border border-tcc-border/50 bg-tcc-panel transition-colors">◀ PREV</button>
            <span class="tracking-widest">{{ weekLabelRange }}</span>
            <button @click="changeWeek(1)" class="hover:text-tcc-hi px-2 py-0.5 border border-tcc-border/50 bg-tcc-panel transition-colors">NEXT ▶</button>
          </div>
        </div>
        
        <div class="flex-grow overflow-hidden flex flex-col text-[10px]">
          <!-- Gantt Header -->
          <div class="flex border-b border-tcc-border/20 mb-2 font-bold text-tcc-text text-center mt-2">
            <div class="w-24 border-r border-tcc-border/20 px-1 text-left opacity-60">TARGET</div>
            <div class="flex-grow grid grid-cols-7">
               <div v-for="(day, i) in currentWeekDays" :key="i" class="flex flex-col pb-1" :class="day.isToday ? 'text-tcc-hi glow-blue bg-tcc-hi/10' : 'opacity-60'">
                 <span class="text-[9px]">{{ day.dayName }}</span>
                 <span class="text-[11px]">{{ day.dateNumber }}</span>
               </div>
            </div>
          </div>
          
          <!-- Gantt Rows -->
          <div class="flex-grow overflow-y-auto custom-scrollbar pr-1 space-y-3 mt-1">
             <div v-for="task in timelineTasks" :key="task.id" class="flex items-center group">
               <div class="w-24 pl-1 truncate pr-2 group-hover:text-tcc-hi transition-colors cursor-pointer" :class="task.status === 'done' ? 'opacity-40 line-through' : 'font-bold text-tcc-text'" @click="openTask(task)" :title="task.title">
                 {{ truncateTask(task.title) }}
               </div>
               <!-- Gantt Bar Calculation Placeholder -->
               <div class="flex-grow grid grid-cols-7 h-5 relative" :title="'Updated: ' + formatTimeOnly(task.updated_at)">
                  <div class="absolute h-full" :class="getGanttBarClass(task)" :style="getGanttBarStyle(task)"></div>
               </div>
             </div>
             <div v-if="timelineTasks.length === 0" class="text-center opacity-30 italic mt-8 text-xs">NO ACTIVE TARGETS IN THIS WINDOW</div>
          </div>
          
          <div class="mt-auto pt-4 flex gap-4 text-[9px] justify-center opacity-70 tracking-widest border-t border-tcc-border/10">
            <span class="flex items-center gap-1.5"><span class="w-3 h-2 bg-tcc-hi shadow-[0_0_4px_#38bdf8]"></span> ACTIVE</span>
            <span class="flex items-center gap-1.5"><span class="w-3 h-2 bg-tcc-warn shadow-[0_0_4px_#f59e0b]"></span> RISK / HIGH PRIO</span>
            <span class="flex items-center gap-1.5"><span class="w-3 h-2 bg-green-500 shadow-[0_0_4px_#22c55e]"></span> DONE</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const pending = ref(true)
const allTasks = ref([])
const selectedProject = ref('ALL UNITS')

const weekOffset = ref(0)
const githubRepoSetting = ref('')

const refresh = async () => {
  pending.value = true
  try {
    if (window.electronAPI && window.electronAPI.getAllMarkdowns) {
      const data = await window.electronAPI.getAllMarkdowns()
      allTasks.value = data.sort((a,b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
    }
  } catch (err) {
    console.error('Error fetching markdowns:', err)
  } finally {
    pending.value = false
  }
}

onMounted(() => {
  refresh()
  githubRepoSetting.value = localStorage.getItem('githubRepo') || ''
})

const uniqueProjects = computed(() => {
  const s = new Set(allTasks.value.map(t => t.project_name || 'UNCLASSIFIED'))
  return Array.from(s).sort()
})

const filteredTasks = computed(() => {
  if(selectedProject.value === 'ALL UNITS') return allTasks.value
  return allTasks.value.filter(t => (t.project_name || 'UNCLASSIFIED') === selectedProject.value)
})

const recentTasks = computed(() => filteredTasks.value.slice(0, 10))
const tasksTodo = computed(() => filteredTasks.value.filter(t => t.status === 'todo' || !t.status))
const tasksInProgress = computed(() => filteredTasks.value.filter(t => t.status === 'in-progress' || t.status === 'inProgress' || t.status === 'engaged'))
const tasksDone = computed(() => filteredTasks.value.filter(t => t.status === 'done' || t.status === 'archived'))

const overdueTasks = computed(() => {
  // Mock logic - if there's a priority=high and it's active
  return tasksInProgress.value.filter(t => String(t.priority).toLowerCase() === 'high')
})

const completionRate = computed(() => {
  const total = tasksTodo.value.length + tasksInProgress.value.length + tasksDone.value.length
  if (total === 0) return 0
  return Math.round((tasksDone.value.length / total) * 100)
})

const openTask = (task) => {
  const hasExtUrl = task.issue_url || task.url || task.html_url
  if (hasExtUrl && window.electronAPI && window.electronAPI.openExternal) {
    window.electronAPI.openExternal(hasExtUrl)
    return
  }
  
  // Also try to form a GH url if there's an issue number
  if (task.issue && githubRepoSetting.value && window.electronAPI && window.electronAPI.openExternal && !task._file) {
     window.electronAPI.openExternal(`https://github.com/${githubRepoSetting.value}/issues/${task.issue}`)
     return
  }

  // Otherwise route to Local TASKS
  router.push({ path: '/tasks', query: { id: task.id } })
}

// TIMELINE LOGIC
const changeWeek = (delta) => {
  weekOffset.value += delta
}

const currentDateRef = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + (weekOffset.value * 7))
  return d
})

const currentWeekDays = computed(() => {
  const days = []
  const current = new Date(currentDateRef.value)
  const dayOfWeek = current.getDay() // 0 is Sunday
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Adjust to make Monday the start
  
  current.setDate(current.getDate() + mondayOffset)
  
  const today = new Date()
  
  for(let i=0; i<7; i++) {
    const d = new Date(current)
    d.setDate(current.getDate() + i)
    days.push({
       dateNumber: d.getDate(),
       dayName: ['S','M','T','W','T','F','S'][d.getDay()], // Short name
       fullDate: new Date(d).toISOString().split('T')[0],
       isToday: d.toDateString() === today.toDateString()
    })
  }
  return days
})

const weekLabelRange = computed(() => {
  const days = currentWeekDays.value
  const m = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
  const start = new Date(days[0].fullDate)
  const end = new Date(days[6].fullDate)
  return `${m[start.getMonth()]} ${start.getDate()} - ${m[end.getMonth()]} ${end.getDate()}`
})

const timelineTasks = computed(() => {
  // Show active tasks and recently updated ones that fall into this week
  // For simplicity, limit to 20
  return filteredTasks.value.slice(0, 20)
})

const truncateTask = (title) => {
  if(!title) return 'Unknown'
  return title.length > 12 ? title.substring(0,10)+'...' : title
}

const getGanttBarStyle = (task) => {
  // Very rough mock mapping: 
  // determine start and end column mapping from 1 to 7 based on updated_at
  const dateStr = task.updated_at || task.created_at
  if (!dateStr) return { left: '10%', right: '50%' }
  
  const d = new Date(dateStr)
  let dayIdx = -1
  currentWeekDays.value.forEach((day, i) => {
     if(day.fullDate === d.toISOString().split('T')[0]) dayIdx = i
  })
  
  if (dayIdx === -1) {
    if (d < new Date(currentWeekDays.value[0].fullDate)) {
       return { left: '0%', width: '10%' }
    } else {
       return { left: '90%', width: '10%' }
    }
  }
  
  const pct = (dayIdx / 7) * 100
  // Span across 2 days artificially
  return { left: `${pct}%`, width: `${(1/7)*100*2}%` }
}

const getGanttBarClass = (task) => {
  if (task.status === 'done' || task.status === 'archived') {
    return 'bg-green-500/80 border-r border-green-500'
  }
  if (String(task.priority).toLowerCase() === 'high') {
    return 'bg-tcc-warn/60 border-r border-tcc-warn shadow-[0_0_8px_rgba(245,158,11,0.4)]'
  }
  return 'bg-tcc-hi shadow-[0_0_10px_rgba(186,230,253,0.3)] border-r border-tcc-hi/80'
}

const formatTimeOnly = (isoString) => {
  if (!isoString) return ''
  const d = new Date(isoString)
  const pad = (n) => n.toString().padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<style scoped>
.pj-tab {
  @apply px-4 py-1.5 text-[11px] border-r border-tcc-border/30 text-tcc-text opacity-70 cursor-pointer transition-colors whitespace-nowrap;
}
.pj-tab:hover { @apply bg-tcc-hi/10; }
.pj-tab.active {
  @apply opacity-100 bg-tcc-hi/20 text-tcc-hi border-b-2 border-b-tcc-hi font-bold;
}
.task-card {
  background-color: rgba(10, 26, 53, 0.45);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(0, 140, 210, 0.25);
  padding: 0.75rem;
  transition: all 0.2s;
}
.task-card:hover {
  border-color: rgba(0, 212, 255, 0.6);
  background-color: rgba(0, 212, 255, 0.06);
  box-shadow: 0 0 8px rgba(0,212,255,0.2);
}
.tag {
  @apply text-[9px] px-1.5 py-0.5 border font-bold uppercase;
}
</style>
