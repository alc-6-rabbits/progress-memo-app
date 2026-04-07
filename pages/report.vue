<template>
  <div class="h-full w-full flex flex-row overflow-hidden relative font-mono">
    
    <!-- Reports List Sidebar -->
    <aside class="w-80 flex-none border-r border-tcc-border/20 bg-tcc-panel/15 backdrop-blur-sm flex flex-col h-full overflow-hidden">
       <div class="p-4 border-b border-tcc-border/20 text-[10px] tracking-widest opacity-60 uppercase font-bold flex justify-between items-center">
         <span>Generated Reports</span>
         <button @click="refresh" class="hover:text-tcc-hi transition-colors" title="Refresh">↻</button>
       </div>
       <div v-if="pending" class="px-4 py-8 text-center text-xs text-tcc-hi animate-pulse tracking-widest">
         SCANNING...
       </div>
       <div v-else class="flex-grow overflow-y-auto custom-scrollbar">
         <template v-for="(group, monthName) in groupedReports" :key="monthName">
            <div class="mt-2 text-[10px] font-bold text-tcc-text opacity-50 px-4 py-1.5 uppercase bg-tcc-bg border-y border-tcc-border/10 tracking-widest">
              [ {{ monthName }} ]
            </div>
            <div v-for="report in group" :key="report._file"
                 @click="selectReport(report)"
                 class="task-item" 
                 :class="{ 'active': activeReport && activeReport._file === report._file }">
               <div class="flex-grow min-w-0">
                  <div class="text-[12px] truncate" :class="activeReport && activeReport._file === report._file ? 'text-white font-bold' : 'text-tcc-text'">
                    {{ extractTitle(report) }}
                  </div>
                  <div class="flex gap-2 mt-1">
                    <span class="text-[10px] opacity-70">{{ formatDateShort(report.created_at) }}</span>
                    <!-- SENT: G-Chat transmitted (Green) -->
                    <span v-if="report.gchat_sent"
                          class="tag text-[8px] font-bold bg-green-500/20 text-green-400 border-green-500/50">SENT</span>
                    <!-- SAVED: Weekly/Saved (Sky Blue) -->
                    <span v-else-if="report.report_status === 'saved'"
                          class="tag text-[8px] font-bold bg-sky-500/20 text-sky-300 border-sky-400/50">SAVED</span>
                    <!-- DRAFT: Unsaved (Amber) -->
                    <span v-else
                          class="tag text-[8px] font-bold bg-amber-500/20 text-amber-400 border-amber-500/50">DRAFT</span>
                  </div>
               </div>
            </div>
         </template>
         <div v-if="allReports.length === 0" class="text-center p-6 text-xs text-tcc-text opacity-50">NO REPORTS FOUND</div>
       </div>
    </aside>

    <!-- TRADITIONAL REPORT EDITOR -->
    <div class="flex-grow flex flex-col h-full overflow-hidden bg-tcc-bg/40 relative">
       
       <div v-if="!activeReport && !isCreating" class="flex-grow flex items-center justify-center text-tcc-text opacity-30 text-xs tracking-widest flex-col gap-4">
         <span>>> SELECT OR GENERATE REPORT</span>
         <div class="flex gap-4 opacity-100">
            <button @click="createReport('daily')" class="btn border-tcc-border text-tcc-text hover:text-white px-4 hover:border-tcc-hi transition-colors">+ NEW DAILY</button>
            <button @click="openWeeklyDatePicker" class="btn border-tcc-border text-tcc-text hover:text-white px-4 hover:border-tcc-hi transition-colors">+ NEW WEEKLY</button>
         </div>
       </div>

       <template v-else>
         <!-- Header -->
         <div class="flex-none p-6 border-b border-tcc-border/20 bg-tcc-panel/40 backdrop-blur-md flex justify-between items-center">
            <div class="flex-grow min-w-0 pr-4">
               <h1 class="text-xl text-tcc-hi font-bold glow-blue tracking-wider truncate">
                 <template v-if="isCreating">GENERATING NEW REPORT...</template>
                 <template v-else>{{ extractTitle(activeReport) }}</template>
               </h1>
               <div class="flex gap-4 mt-2 text-[10px] text-tcc-text uppercase tracking-widest">
                 <span v-if="!isCreating && isDailyReport" class="flex items-center gap-1.5" :class="activeReport.gchat_sent ? 'text-green-400' : ''">
                   <span v-if="!activeReport.gchat_sent" class="w-2 h-2 rounded-full bg-tcc-warn animate-pulse"></span>
                   <span v-else class="w-2 h-2 rounded-full bg-green-500"></span> 
                   G-CHAT: {{ activeReport.gchat_sent ? 'TRANSMITTED' : 'NOT SENT' }}
                 </span>
                 <!-- Weekly: SAVED status (blue) -->
                 <span v-if="!isCreating && !isDailyReport && activeReport.report_status === 'saved'" class="flex items-center gap-1.5 text-sky-400">
                   <span class="w-2 h-2 rounded-full bg-sky-400"></span>
                   STATUS: SAVED
                 </span>
                 <!-- Weekly: DRAFT status (amber) -->
                 <span v-if="!isCreating && !isDailyReport && activeReport.report_status !== 'saved'" class="flex items-center gap-1.5 text-amber-400">
                   <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                   STATUS: DRAFT
                 </span>
                 <span v-if="!isCreating && isDailyReport" class="opacity-30">|</span>
                 <span v-if="!isCreating" class="truncate">GENERATED: {{ formatDateLong(activeReport.created_at) }}</span>
               </div>
            </div>
            
            <div class="flex gap-2 flex-none">
               <button @click="createReport('daily')" class="btn border-tcc-border text-tcc-text hover:text-white px-3" :disabled="isFetchingActivity">+ DAILY</button>
               <button @click="openWeeklyDatePicker" class="btn border-tcc-border text-tcc-text hover:text-white px-3" :disabled="isFetchingActivity">+ WEEKLY</button>
               <div class="w-px h-6 bg-tcc-border/40 mx-2 self-center"></div>
               
               <template v-if="!isCreating">
                 <button v-if="!isEditing" class="btn btn-primary px-6" @click="toggleEdit">>> EDIT REPORT</button>
                 <button v-if="isEditing" class="btn border-green-500 text-green-500 hover:bg-green-500 hover:text-black font-bold px-6" @click="saveChanges" :disabled="isSaving">
                   {{ isSaving ? 'SAVING...' : '[ SAVE ]' }}
                 </button>
                 <button v-if="isEditing && isDailyReport" class="btn border-tcc-warn text-tcc-warn hover:bg-tcc-warn hover:text-black font-bold px-6" :class="{'animate-pulse': !isSending}" @click="transmitToChat" :disabled="isSending || isSaving">
                   {{ isSending ? 'TRANSMITTING...' : '[ TRANSMIT TO G-CHAT ]' }}
                 </button>
               </template>
               <template v-else>
                 <span class="text-tcc-warn text-xs border border-tcc-warn px-4 py-1.5 flex items-center font-bold tracking-widest animate-pulse">SYNTHESIZING...</span>
               </template>
            </div>
         </div>

         <!-- Content Area -->
         <div class="flex-grow flex overflow-hidden relative">
            
            <!-- EDITOR PANEL -->
            <div v-show="isEditing && !isCreating" class="w-1/2 flex-none border-r border-tcc-border/20 bg-black/30 flex flex-col" style="transition: all 0.3s; transform-origin: left">
               <div class="flex-none bg-tcc-panel/40 backdrop-blur-sm px-4 py-2 border-b border-tcc-border/20 flex gap-1.5 overflow-x-auto items-center">
                  <button @click="insertSyntax('**', '**')" class="toolbar-btn font-bold">B</button>
                  <button @click="insertSyntax('_', '_')" class="toolbar-btn italic">I</button>
                  <button @click="insertSyntax('~~', '~~')" class="toolbar-btn line-through">S</button>
                  
                  <template v-if="!isDailyReport">
                      <div class="w-px h-6 bg-tcc-border/30 mx-1"></div>
                      <select class="bg-black/40 border border-tcc-border/30 text-tcc-hi text-xs p-1 outline-none w-16 cursor-pointer" @change="(e) => { if(e.target.value !== 'H') { insertSyntax(e.target.value + ' ', ''); e.target.value='H'; } }">
                          <option value="H" disabled selected>H</option>
                          <option value="#">H1</option>
                          <option value="##">H2</option>
                          <option value="###">H3</option>
                          <option value="####">H4</option>
                      </select>
                      <button @click="insertSyntax('- ', '')" class="toolbar-btn font-bold leading-none font-sans" title="Bullet List">●</button>
                      <button @click="insertSyntax('- [ ] ', '')" class="toolbar-btn font-bold text-[10px] leading-none px-1" title="Checkbox">[ ]</button>
                      <button @click="insertSyntax('\n---\n', '')" class="toolbar-btn font-bold leading-none px-1 text-[10px] tracking-tighter" title="Horizontal Rule">---</button>
                      <button @click="insertSyntax('[', '](url)')" class="toolbar-btn font-bold leading-none text-[9px] px-1" title="Link">URL</button>
                      <button @click="insertSyntax('```\n', '\n```')" class="toolbar-btn font-mono font-bold leading-none px-1" title="Code Block">{ }</button>
                  </template>
               </div>
               <textarea ref="editorTextarea" v-model="editContent" class="editor-textarea custom-scrollbar border-0 flex-grow" placeholder="Report data..."></textarea>
            </div>

            <!-- PREVIEW PANEL -->
            <div class="flex-grow p-8 overflow-y-auto custom-scrollbar bg-black/5 relative" :class="(!isEditing || isCreating) ? 'w-full' : 'w-1/2'">
               <div class="max-w-3xl mx-auto space-y-8 pb-16">
                  <!-- Main rendered markdown -->
                  <div class="border border-tcc-border/20 p-8 bg-black/40 shadow-xl" v-html="previewHtml"></div>
                  
                  <!-- Google Chat Mockup -->
                  <div v-if="isDailyReport" class="mt-8 border border-tcc-border/50 bg-[#1e2022] shadow-xl p-5 relative text-[#e8eaed] font-sans rounded-lg z-[10000]">
                    <div class="absolute -top-3 left-4 bg-tcc-warn px-2 py-0.5 text-[9px] font-bold text-black tracking-widest uppercase rounded shadow">Google Chat Render Preview</div>
                    <div class="flex gap-3">
                      <div class="w-8 h-8 rounded-full bg-blue-600/30 border border-tcc-hi flex items-center justify-center text-tcc-hi font-bold text-xs flex-none shadow-sm">UPL</div>
                      <div class="flex-grow">
                        <div class="text-xs font-bold text-[#e8eaed] mb-1">TCC Uplink Bot <span class="font-normal text-[#9aa0a6] ml-2">Just now</span></div>
                        <div class="text-[13px] text-[#e8eaed] break-words leading-relaxed whitespace-pre-wrap" v-html="gchatPreviewHtml"></div>
                      </div>
                    </div>
                  </div>
               </div>
               
               <!-- Messages Overlay -->
               <div v-if="sysMsg" class="absolute bottom-4 left-1/2 -translate-x-1/2 border px-6 py-2 shadow-2xl tracking-widest font-bold text-xs bg-black/90 z-20" :class="sysMsgType === 'error' ? 'border-red-500 text-red-400' : 'border-tcc-hi text-tcc-hi'">
                 {{ sysMsg }}
               </div>
            </div>
         </div>
       </template>

       <!-- Weekly Date Picker Modal -->
       <div v-if="showWeeklyDatePicker" class="absolute inset-0 bg-black/80 backdrop-blur-sm z-[20000] flex items-center justify-center font-sans tracking-widest">
          <div class="bg-[#1e2022] border border-tcc-hi shadow-[0_0_30px_rgba(30,144,255,0.2)] p-8 max-w-sm w-full">
             <h2 class="text-tcc-hi text-lg font-bold mb-6 border-b border-tcc-hi/30 pb-2 glow-blue">WEEKLY REPORT PERIOD</h2>
             <div class="space-y-4 mb-8">
                <div class="flex flex-col gap-1">
                   <label class="text-xs text-tcc-text">START DATE:</label>
                   <input ref="startPickerInput" type="text" class="bg-black/50 border border-tcc-border text-white px-3 py-2 text-sm focus:border-tcc-hi outline-none" placeholder="YYYY/MM/DD">
                </div>
                <div class="flex flex-col gap-1">
                   <label class="text-xs text-tcc-text">END DATE:</label>
                   <input ref="endPickerInput" type="text" class="bg-black/50 border border-tcc-border text-white px-3 py-2 text-sm focus:border-tcc-hi outline-none" placeholder="YYYY/MM/DD">
                </div>
             </div>
             <div class="flex justify-end gap-3">
                <button @click="showWeeklyDatePicker = false" class="btn border-tcc-border text-tcc-text hover:text-white px-4 py-2 text-xs">CANCEL</button>
                <button @click="confirmWeeklyReport" class="btn btn-primary px-6 py-2 text-xs">GENERATE >></button>
             </div>
          </div>
       </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { marked } from 'marked'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.min.css'
import 'flatpickr/dist/themes/dark.css'
import { useGitHubREST } from '~/composables/useGitHubREST'
import { useGitHubGraphQL } from '~/composables/useGitHubGraphQL'
import { useGoogleChatMd } from '~/composables/useGoogleChatMd'

const pending = ref(true)
const allReports = ref([])
const activeReport = ref(null)
const isEditing = ref(false)
const isCreating = ref(false)
const isSaving = ref(false)
const isSending = ref(false)
const isFetchingActivity = ref(false)

const isDailyReport = computed(() => {
   if (!activeReport.value) return false
   const t = activeReport.value.type || ''
   if (t === 'daily') return true
   if (activeReport.value._file && activeReport.value._file.includes('daily')) return true
   return false
})

const editContent = ref('')
const editorTextarea = ref(null)

const sysMsg = ref('')
const sysMsgType = ref('success') // success, error

const { fetchUserEvents, formatEventsAsMarkdown, postIssueComment, parseIssueUrl } = useGitHubREST()
const { fetchAllProjectItems, formatProjectProgress } = useGitHubGraphQL()
const { convertToGoogleChat, renderGoogleChatPreview } = useGoogleChatMd()

const format = (d) => `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`

const showWeeklyDatePicker = ref(false)
const weeklyStartDate = ref('')
const weeklyEndDate = ref('')
const startPickerInput = ref(null)
const endPickerInput = ref(null)

const openWeeklyDatePicker = () => {
   const now = new Date()
   const m = new Date(now)
   m.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1))
   const f = new Date(m)
   f.setDate(m.getDate() + 4)
   
   weeklyStartDate.value = format(m)
   weeklyEndDate.value = format(f)
   showWeeklyDatePicker.value = true
   
   nextTick(() => {
      if (startPickerInput.value && !startPickerInput.value._flatpickr) {
         flatpickr(startPickerInput.value, {
            dateFormat: "Y/m/d",
            defaultDate: weeklyStartDate.value,
            onChange: (selectedDates, dateStr) => { weeklyStartDate.value = dateStr }
         })
      } else if (startPickerInput.value && startPickerInput.value._flatpickr) {
         startPickerInput.value._flatpickr.setDate(weeklyStartDate.value)
      }

      if (endPickerInput.value && !endPickerInput.value._flatpickr) {
         flatpickr(endPickerInput.value, {
            dateFormat: "Y/m/d",
            defaultDate: weeklyEndDate.value,
            onChange: (selectedDates, dateStr) => { weeklyEndDate.value = dateStr }
         })
      } else if (endPickerInput.value && endPickerInput.value._flatpickr) {
         endPickerInput.value._flatpickr.setDate(weeklyEndDate.value)
      }
   })
}

const confirmWeeklyReport = () => {
   showWeeklyDatePicker.value = false
   createReport('weekly', weeklyStartDate.value, weeklyEndDate.value)
}

const withCommentMarkers = (text) => {
   if (!text) return ''
   return text.split('\n').map(line => {
      if (line.trim().startsWith('- ')) {
         return `${line}  \n  ⇒  `
      }
      return line
   }).join('\n')
}

const buildReportTemplate = async (options) => {
   const { type, title, startStr, endStr, allLocalTasks, activeTasks, hasGitHub } = options
   
   let githubMd = '（GitHub 連携が設定されていません）'
   if (hasGitHub) {
      try {
         const { events, error: fetchError } = type === 'daily' ? await fetchUserEvents(startStr) : await fetchUserEvents(startStr, endStr)
         if (fetchError) {
            console.warn('Failed to fetch events', fetchError)
            githubMd = `（GitHub アクティビティの取得中にエラーが発生しました: ${fetchError}）`
         } else {
            githubMd = formatEventsAsMarkdown(events)
         }
      } catch (e) {
         console.warn('Failed to fetch events', e)
         githubMd = `（取得に失敗しました: ${e.message}）`
      }
   }
   
   const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2, undefined: 3 }
   const sortedTasks = [...activeTasks].sort((a, b) => {
      const pa = priorityOrder[a.priority] ?? 3
      const pb = priorityOrder[b.priority] ?? 3
      if (pa !== pb) return pa - pb
      const da = a.due_date ? new Date(a.due_date).getTime() : 9999999999999
      const db = b.due_date ? new Date(b.due_date).getTime() : 9999999999999
      return da - db
   })
   const nextTasksMd = sortedTasks.slice(0, 5).map(t => `- [${t.project_name || '?'}] ${t.title}`).join('\n')
   const nextTasksCommented = nextTasksMd.length > 0 ? withCommentMarkers(nextTasksMd) : '（予定されているタスクはありません）'

   const s = new Date(startStr); s.setHours(0,0,0,0)
   const e = type === 'daily' ? new Date() : new Date(endStr)
   e.setHours(23,59,59,999)
   
   const periodTasks = allLocalTasks.filter(t => t.updated_at && (new Date(t.updated_at).getTime() >= s.getTime() && new Date(t.updated_at).getTime() <= e.getTime()))
   const periodTasksMd = periodTasks.length > 0
      ? periodTasks.map(t => `- [${t.project_name || 'UNCLASSIFIED'}] ${t.title} (${t.status})`).join('\n')
      : ''
   const periodTasksCommented = periodTasksMd.length > 0 ? withCommentMarkers(periodTasksMd) : '（記録されたタスク更新はありません）'

   let progressSection = ''
   if (hasGitHub) {
      try {
         const items = await fetchAllProjectItems()
         const md = formatProjectProgress(items)
         if (md) {
            progressSection = `## 1. プロジェクト進捗状況\n${md}\n\n`
         }
      } catch (err) {
         console.warn('Failed to fetch project progress:', err)
      }
   }

   const section2Title = type === 'daily' ? (progressSection ? '2. 本日の実績' : '1. 本日の実績') : (progressSection ? '2. 今週の実績' : '1. 今週の実績')
   const section3Title = type === 'daily' ? (progressSection ? '3. 明日の予定' : '2. 明日の予定') : (progressSection ? '3. 来週の予定' : '2. 来週の予定')

   let template = `# ${title}\n\n`
   template += progressSection
   template += `## ${section2Title}\n### [GitHub Activity]\n${withCommentMarkers(githubMd)}\n\n`
   template += `### [Local Tasks]\n${periodTasksCommented}\n\n`
   template += `## ${section3Title}\n${nextTasksCommented}\n\n`
   if (type === 'weekly') {
      template += `## 4. 特記事項 / 定例メモ\n\n`
   }
   template += `以上です。`
   
   return template
}

const refresh = async () => {
  pending.value = true
  try {
    if (window.electronAPI && window.electronAPI.getAllReports) {
      const customDirPath = localStorage.getItem('tasksDir') || ''
      const data = await window.electronAPI.getAllReports(customDirPath)
      allReports.value = data
      if (activeReport.value) {
         const updated = data.find(r => r._file === activeReport.value._file)
         if (updated) {
            activeReport.value = updated
         }
      } else if (data.length > 0) {
         selectReport(data[0])
      }
    }
  } catch (e) {
    console.error('Failed to get reports', e)
  } finally {
    pending.value = false
  }
}

onMounted(() => {
  refresh()
})

const showMessage = (msg, type = 'success') => {
  sysMsg.value = msg
  sysMsgType.value = type
  setTimeout(() => sysMsg.value = '', 4000)
}

const selectReport = (report) => {
  if (isEditing.value) {
     if(!confirm('Unsaved changes will be lost. Switch report?')) return
  }
  activeReport.value = report
  isEditing.value = false
  editContent.value = report.content || ''
}

const toggleEdit = () => {
  isEditing.value = !isEditing.value
  if (!isEditing.value) {
    // Reset to saved content on cancel
    editContent.value = activeReport.value.content
  }
}

// ----- formatting/helpers -----

const groupedReports = computed(() => {
  const groups = {}
  allReports.value.forEach(r => {
     const date = new Date(r.created_at)
     const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`
     if(!groups[key]) groups[key] = []
     groups[key].push(r)
  })
  return groups
})

// Helper: 3-state status label for the sidebar
const getStatusLabel = (report) => {
  if (report.gchat_sent) return 'SENT'
  if (report.report_status === 'saved') return 'SAVED'
  return 'DRAFT'
}

const getStatusBadgeClass = (report) => {
  if (report.gchat_sent) return 'bg-green-500/10 text-green-400 border-green-500'
  if (report.report_status === 'saved') return 'bg-tcc-hi/10 text-tcc-hi border-tcc-hi'
  return 'bg-tcc-warn/10 text-tcc-warn border-tcc-warn'
}

const formatDateShort = (isoString) => {
  if(!isoString) return ''
  const d = new Date(isoString)
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
}

const formatDateLong = (isoString) => {
  if(!isoString) return ''
  const d = new Date(isoString)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

const extractTitle = (report) => {
  if(!report) return ''
  if(report.title) return report.title
  
  // Try to find first H1 or H2
  const match = (report.content || '').match(/^#+\s+(.*)$/m)
  if(match && match[1]) {
     return match[1].trim()
  }
  return report._file || 'Untitled Report'
}

const previewHtml = computed(() => {
   const raw = isEditing.value ? editContent.value : (activeReport.value ? activeReport.value.content : '')
   if (!raw) return '<p class="opacity-30 italic text-sm">No tactical data...</p>'
   
   let html = marked(raw)
   // Hacky way to inject tailwind classes
   html = html.replace(/<h1(.*?)>/g, '<h1 class="text-2xl text-tcc-hi font-bold tracking-widest mb-6 border-b border-tcc-hi/20 pb-2">')
   html = html.replace(/<h2(.*?)>/g, '<section class="border-l-4 border-tcc-border/40 pl-6 border-b border-tcc-border/10 pb-6 my-6"><h2 class="text-tcc-text text-lg font-bold tracking-widest mb-4">')
   html = html.replace(/<\/h2>/g, '</h2></section>') 
   html = html.replace(/<h3(.*?)>/g, '<h3 class="text-white text-md font-bold text-white mt-6 mb-2 flex items-center gap-2">')
   
   html = html.replace(/<ul>/g, '<ul class="space-y-1 text-sm pl-4 mb-4 text-tcc-text">')
   html = html.replace(/<li>/g, '<li class="flex items-start gap-2 relative pl-3 before:content-[\'•\'] before:absolute before:left-0 before:text-tcc-border">')
   
   return html.replace(/<\/li>/g, '</li>')
})

const gchatPreviewHtml = computed(() => {
   const raw = isEditing.value ? editContent.value : (activeReport.value ? activeReport.value.content : '')
   if (!raw) return '...'
   return renderGoogleChatPreview(raw)
})

const insertSyntax = (start, end) => {
  if (!editorTextarea.value) return
  const el = editorTextarea.value
  const selStart = el.selectionStart
  const selEnd = el.selectionEnd
  const text = editContent.value
  
  const before = text.substring(0, selStart)
  const selected = text.substring(selStart, selEnd)
  const after = text.substring(selEnd)
  
  editContent.value = before + start + selected + end + after
  
  setTimeout(() => {
    el.focus()
    el.setSelectionRange(selStart + start.length, selStart + start.length + selected.length)
  }, 0)
}

// ----- API Logic -----

const getLocalTasks = async () => {
   if (window.electronAPI && window.electronAPI.getAllMarkdowns) {
      return await window.electronAPI.getAllMarkdowns()
   }
   return []
}

const createReport = async (type, customStart = null, customEnd = null) => {
   if(isEditing.value) {
      if(!confirm('Discard unsaved edits to generate new report?')) return
   }
   isCreating.value = true
   isFetchingActivity.value = true
   
   try {
      const now = new Date()
      let title, startStr, endStr
      
      const allLocalTasks = await getLocalTasks()
      const activeTasks = allLocalTasks.filter(t => t.status === 'in-progress' || t.status === 'inProgress' || t.status === 'engaged' || !t.status || t.status === 'todo')
      
      if(type === 'daily') {
         startStr = format(now)
         endStr = startStr
         title = `DAILY REPORT: ${startStr}`
      } else {
         startStr = customStart
         endStr = customEnd
         title = `WEEKLY REPORT: ${startStr}-${endStr}`
      }
      
      const hasGitHub = !!(localStorage.getItem('githubPat'))
      const template = await buildReportTemplate({
         type, title, startStr, endStr, allLocalTasks, activeTasks, hasGitHub
      })
      
      const newFilestr = `${type}-report-${now.toISOString().split('T')[0]}.md`
      
      const newRep = {
         _file: newFilestr,
         title: title,
         type: type,
         gchat_sent: false,
         created_at: now.toISOString(),
         updated_at: now.toISOString(),
         content: template
      }
      
      activeReport.value = newRep
      editContent.value = template
      isEditing.value = true
      
   } catch (e) {
      console.error(e)
      showMessage(`Synthesis failed: ${e.message}`, 'error')
   } finally {
      isCreating.value = false
      isFetchingActivity.value = false
   }
}

const saveChanges = async () => {
   isSaving.value = true
   try {
      if(!activeReport.value) return
      
      // construct yaml
      let fmStr = '---\n'
      fmStr += `title: "${extractTitle({content: editContent.value})}"\n`
      fmStr += `type: "${activeReport.value.type || 'daily'}"\n`
      fmStr += `gchat_sent: ${!!activeReport.value.gchat_sent}\n`
      // 3-state status: saved (weekly/saved), sent (daily+transmitted), draft (unsaved)
      const reportStatus = activeReport.value.gchat_sent ? 'sent' : (isDailyReport.value ? 'draft' : 'saved')
      fmStr += `report_status: "${reportStatus}"\n`
      fmStr += `created_at: "${activeReport.value.created_at || new Date().toISOString()}"\n`
      fmStr += `updated_at: "${new Date().toISOString()}"\n`
      fmStr += '---\n\n'
      fmStr += editContent.value
      
      const filename = activeReport.value._file
      
      if(window.electronAPI && window.electronAPI.saveReport) {
         const customDirPath = localStorage.getItem('tasksDir') || ''
         const response = await window.electronAPI.saveReport(filename, fmStr, customDirPath)
         if(response.success) {
            showMessage('REPORT DATA SECURED.')
            isEditing.value = false
            await refresh()
         } else {
            showMessage(`SAVE FAILED: ${response.error}`, 'error')
         }
      }
   } catch (e) {
      showMessage(`ERROR: ${e.message}`, 'error')
   } finally {
      isSaving.value = false
   }
}

const transmitToChat = async () => {
   let webhookUrl = localStorage.getItem('googleChatWebhook') || ''
   
   if (webhookUrl && window.electronAPI && window.electronAPI.decryptString) {
      try {
         webhookUrl = await window.electronAPI.decryptString(webhookUrl)
      } catch (e) {
         // ignore
      }
   }

   if (!webhookUrl) {
      showMessage('NO WEBHOOK URL CONFIGURED IN SETTINGS.', 'error')
      return
   }

   isSending.value = true
   
   try {
      const payloadText = convertToGoogleChat(editContent.value)
      
      const response = await fetch(webhookUrl, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ text: payloadText })
      })

      if (response.ok) {
         showMessage('UPLINK TRANSMISSION SUCCESSFUL.')
         activeReport.value.gchat_sent = true
         await saveChanges() // Save the updated status
      } else {
         showMessage(`TRANSMISSION FAILED: ${response.statusText}`, 'error')
      }
   } catch (e) {
      showMessage(`ERROR: ${e.message}`, 'error')
   } finally {
      isSending.value = false
   }
}
</script>

<style scoped>
.task-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid rgba(42, 106, 154, 0.1);
  cursor: pointer;
  transition: all 0.2s;
}
.task-item:hover {
  background-color: rgba(186, 230, 253, 0.1);
}
.task-item.active {
  background-color: rgba(186, 230, 253, 0.2);
  border-left: 4px solid #bae6fd;
}

.editor-textarea {
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  color: #bae6fd;
  padding: 1.5rem;
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.625;
  outline: none;
  resize: none;
}
.editor-textarea:focus {
  border-right: 1px solid rgba(186, 230, 253, 0.5);
}

.toolbar-btn {
  width: 1.75rem;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(42, 106, 154, 0.3);
  color: #8cb4cf;
  font-size: 0.75rem;
  cursor: pointer;
  transition: colors 0.2s;
}
.toolbar-btn:hover {
  background-color: rgba(186, 230, 253, 0.2);
  color: #bae6fd;
}
</style>
