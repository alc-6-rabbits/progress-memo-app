<template>
  <div class="p-8 h-full glass-panel relative flex flex-col overflow-hidden font-mono">
    <div class="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-ace-highlight m-4 opacity-50"></div>
    <div class="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-ace-highlight m-4 opacity-50"></div>

    <div class="flex justify-between items-center mb-6 border-b border-white/20 pb-4 shrink-0">
      <h1 class="text-2xl font-mono tracking-widest text-ace-title drop-shadow-title">>> COMMUNICATION UPLINK</h1>
      <NuxtLink to="/" class="text-ace-text hover:text-ace-highlight font-mono tracking-widest text-sm">[ CANCEL & RTB ]</NuxtLink>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow overflow-hidden">
      <!-- Editor Column -->
      <div class="border border-ace-border/30 p-6 bg-ace-bg/30 overflow-y-auto relative">
        <h2 class="text-lg font-bold mb-6 tracking-widest text-ace-highlight flex items-center"><span class="w-2 h-4 bg-ace-highlight mr-2 inline-block"></span>MISSION DATA ENTRY</h2>
        
        <div class="mb-6">
          <label class="block text-xs font-bold text-ace-text tracking-widest mb-2">TARGET DATETIME</label>
          <div class="relative">
            <input ref="pickerInput" v-model="targetReportDate" type="text" placeholder="YYYY/MM/DD" class="block w-full ace-input bg-ace-bg/50 p-2 border border-ace-border focus:border-ace-highlight focus:ring-1 focus:ring-ace-highlight transition-all text-white cursor-pointer select-none">
            <span class="absolute right-3 top-2.5 opacity-50 pointer-events-none text-ace-highlight">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
              </svg>
            </span>
          </div>
        </div>

        <div class="mb-4 flex justify-between items-end border-b border-ace-border/30 pb-2">
          <h3 class="text-sm font-bold tracking-widest text-ace-text">PROJECTS & TASKS</h3>
          <button @click="addProject" class="ace-button text-[10px] border-ace-text text-ace-text hover:bg-ace-highlight hover:text-ace-bg">+ ADD PROJECT</button>
        </div>

        <div v-for="(project, pIndex) in reportData" :key="pIndex" class="mb-6 border-l-2 border-ace-warning pl-4 relative group">
          <div class="flex items-center space-x-2 mb-3">
            <span class="text-ace-warning font-bold">></span>
            <input v-model="project.name" list="report-projects-list" type="text" placeholder="PROJECT DESIGNATION" class="block w-full ace-input bg-transparent py-1 font-bold text-white text-sm placeholder-ace-text/50">
            <button @click="removeProject(pIndex)" class="text-red-500 hover:text-red-300 p-1 opacity-50 group-hover:opacity-100 transition-opacity">×</button>
          </div>
          <datalist id="report-projects-list">
            <option v-for="[id, proj] in Object.entries(projectsData.project)" :key="id" :value="proj.name"></option>
          </datalist>
          
          <div class="pl-4 space-y-4">
            <div v-for="(task, tIndex) in project.tasks" :key="tIndex" class="relative group/task border-l border-ace-border/30 pl-3">
              <input v-model="task.name" :list="'task-list-' + pIndex + '-' + tIndex" @change="onTaskNameChange(pIndex, tIndex)" type="text" placeholder="TASK IDENTIFIER" class="block w-full ace-input bg-transparent text-sm py-1 mb-2 placeholder-ace-text/40 text-ace-highlight">
              <datalist :id="'task-list-' + pIndex + '-' + tIndex">
                <option v-for="t in activeTasks.filter(at => at.project_name === project.name)" :key="t.id || t._file" :value="t.title"></option>
              </datalist>
              <textarea v-model="task.details" rows="3" placeholder="- Action&#10;⇒ Result" class="block w-full bg-ace-bg/50 border border-ace-border/50 p-2 text-xs text-ace-text focus:border-ace-highlight outline-none resize-y font-sans"></textarea>
              <button @click="removeTask(pIndex, tIndex)" class="absolute top-0 right-0 text-red-500 hover:text-red-300 text-xs px-1 opacity-0 group-hover/task:opacity-100 transition-opacity">×</button>
            </div>
            <button @click="addTask(pIndex)" class="text-[10px] text-ace-highlight hover:text-white transition-colors tracking-widest">+ ADD TASK</button>
          </div>
        </div>
      </div>

      <!-- Preview Column -->
      <div class="bg-[#050c14] border border-ace-border p-6 shadow flex flex-col relative overflow-hidden">
        <!-- Scanlines effect for the display -->
        <div class="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-0 rounded"></div>

        <div class="flex items-end justify-between mb-4 border-b border-white/20 pb-0 relative z-10 w-full">
          <div class="flex space-x-1 mt-1">
            <button 
              @click="activeTab = 'payload'"
              class="px-4 py-2 font-bold tracking-widest text-xs transition-colors border border-b-0 rounded-t-sm"
              :class="activeTab === 'payload' ? 'bg-white text-black border-white' : 'bg-transparent text-ace-text border-transparent hover:bg-white/10'"
            >
              CURRENT PAYLOAD
            </button>
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
            <button v-if="activeTab === 'payload'" @click="sendWebhook" class="ace-button ace-button-primary border-white text-white hover:bg-white hover:text-black" :disabled="isSending">
              {{ isSending ? 'TRANSMITTING...' : 'INITIATE UPLINK >>' }}
            </button>
          </div>
        </div>

        <div v-if="activeTab === 'payload'" class="flex-grow overflow-y-auto font-sans text-xs whitespace-pre p-4 border border-ace-highlight/30 text-green-400 relative z-10 bg-black/50 overflow-x-auto shadow-[inset_0_0_10px_rgba(0,255,0,0.1)]">
{{ formattedReport }}
        </div>

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
import { ref, computed, onMounted, watch } from 'vue'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.css'

const pickerInput = ref(null)
const webhookUrl = ref('')
const targetReportDate = ref(new Date().toISOString().split('T')[0])
const isSending = ref(false)
const isDistributing = ref(false)
const isSavingAccumulation = ref(false)
const successMsg = ref('')
const errorMsg = ref('')
const isInitializing = ref(true)

const activeTab = ref('payload')
const accumulationText = ref('')

const projectsData = ref({ project: {} })
const reportData = ref([])
const activeTasks = ref([])

const addProject = () => reportData.value.push({ name: '', id: null, tasks: [{ name: '', details: '', filename: null }] })
const removeProject = (pIndex) => reportData.value.splice(pIndex, 1)
const addTask = (pIndex) => reportData.value[pIndex].tasks.push({ name: '', details: '', filename: null })
const removeTask = (pIndex, tIndex) => reportData.value[pIndex].tasks.splice(tIndex, 1)

const onTaskNameChange = (pIndex, tIndex) => {
  const taskRow = reportData.value[pIndex].tasks[tIndex]
  const matched = activeTasks.value.find(t => t.title === taskRow.name && t.project_name === reportData.value[pIndex].name)
  if (matched) {
    taskRow.filename = matched._file || (matched.id ? `${matched.id}.md` : null)
  }
}

// Generate Markdown based on user's preferred format
const formattedReport = computed(() => {
  const dateStr = targetReportDate.value.replace(/-/g, '/')
  let markdown = `【日報　${dateStr}】\n`

  reportData.value.forEach(project => {
    if (!project.name) return
    markdown += `　【${project.name}】\n`
    
    project.tasks.forEach(task => {
      if (!task.name) return
      markdown += `　　・${task.name}\n`
      
      if (task.details) {
        // Format details: Ensure lines are indented properly under the task
        const lines = task.details.split('\n')
        lines.forEach(line => {
          if (line.trim() === '') {
            markdown += `\n`
          } else if (line.trim().startsWith('・') || line.trim().startsWith('⇒')) {
             // For lines already formatted by user manually
             markdown += `　　　${line.trim()}\n`
          } else {
             // Default indent
             markdown += `　　　　${line}\n`
          }
        })
      }
      markdown += `\n`
    })
  })
  
  markdown += `以上です。`
  return markdown
})

const sendWebhook = async () => {
  if (!webhookUrl.value) {
    errorMsg.value = 'Please provide a Webhook URL.'
    return
  }

  isSending.value = true
  successMsg.value = ''
  errorMsg.value = ''

  try {
    const response = await fetch(webhookUrl.value, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: formattedReport.value
      })
    })

     if (response.ok) {
      successMsg.value = 'Report sent to Google Chat successfully! Accumulating records...'
      console.log("[REPORT] Webhook success. Attempting accumulation...")
      
      // Also append to accumulation file automatically!
      if (window.electronAPI && window.electronAPI.appendAccumulation) {
         try {
             // Prepare payload mapping
             const accumulationArgs = []
             for (const proj of reportData.value) {
                 if (!proj.name) continue
                 
                 // Fallback if project id is missing (newly typed project name)
                 let pId = proj.id
                 if (!pId) {
                     const match = Object.entries(projectsData.value.project).find(([_, p]) => p.name === proj.name)
                     if (match) pId = match[0]
                     else pId = "1" // Default Inbox/unclassified for unknown
                 }
                 
                 for (const task of proj.tasks) {
                     if (!task.name) continue
                     if (!task.details || task.details.trim() === '' || task.details.trim() === '-' || task.details.trim() === '・') continue
                     
                     // We need a filename. If task was dynamically added, we can't reliably map it, but do our best.
                     if (task.filename) {
                         accumulationArgs.push({
                             project_id: pId,
                             project_name: proj.name,
                             title: task.name,
                             filename: task.filename,
                             details: task.details
                         })
                     } else {
                         console.warn(`Cannot accumulate ${task.name} because it lacks a source filename link.`)
                     }
                 }
             }
             
             console.log("[REPORT] accumulationArgs prepared:", accumulationArgs)
             if (accumulationArgs.length > 0) {
                 const customDir = localStorage.getItem('tasksDir') || undefined
                 console.log("[REPORT] Calling electronAPI.appendAccumulation with customDir:", customDir)
                 const res = await window.electronAPI.appendAccumulation(accumulationArgs, customDir)
                 console.log("[REPORT] appendAccumulation result:", res)
                 if (!res.success) {
                     errorMsg.value = `Sent to Chat, but failed to log accumulation: ${res.error}`
                 } else {
                     successMsg.value = 'Report sent and successfully accumulated locally!'
                 }
             } else {
                 console.log("[REPORT] No valid accumulation arguments formed.")
             }
         } catch(e) {
             console.error('Accumulation error', e)
         }
      } else {
          console.warn("[REPORT] window.electronAPI.appendAccumulation not found!")
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
            setTimeout(() => { if (successMsg.value === 'Accumulation logs saved successfully!') successMsg.value = '' }, 3000)
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
        errorMsg.value = "Electron API for distribution not available."
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
    } catch(e) {
        errorMsg.value = e.message
    } finally {
        isDistributing.value = false
    }
}

onMounted(async () => {
  isInitializing.value = true
  console.log('[Report] Component mounted, loading settings...')
  // Initialize flatpickr
  if (pickerInput.value) {
    flatpickr(pickerInput.value, {
      dateFormat: "Y/m/d",
      defaultDate: targetReportDate.value,
      onChange: (selectedDates, dateStr) => {
        targetReportDate.value = dateStr
      }
    })
  }

  const savedUrl = localStorage.getItem('googleChatWebhook') || ''
  if (savedUrl) {
    if (window.electronAPI && window.electronAPI.decryptString) {
      console.log('[Report] Decrypting webhook URL...')
      webhookUrl.value = await window.electronAPI.decryptString(savedUrl)
    } else {
      webhookUrl.value = savedUrl
    }
  }

  try {
    if (window.electronAPI && window.electronAPI.getAllMarkdowns) {
      const customDir = localStorage.getItem('tasksDir') || undefined
      
      // Fetch projects for datalist
      if (window.electronAPI.getProjects) {
        const pData = await window.electronAPI.getProjects(customDir)
        if (pData && pData.project) projectsData.value = pData
      }

      const allTasks = await window.electronAPI.getAllMarkdowns(customDir)
      
      activeTasks.value = allTasks.filter(t => t.status === 'inProgress' || t.status === 'icebox')
      
      const inProgressTasks = allTasks.filter(t => t.status === 'inProgress')
      
      if (inProgressTasks.length > 0) {
        const projectMap = {}
        inProgressTasks.forEach(t => {
          const projName = (t.project_name && t.project_name !== 'Inbox') ? t.project_name : '未分類 (Inbox)'
          if (!projectMap[projName]) {
             projectMap[projName] = {
                 name: projName,
                 id: t.project_id || "1",
                 tasks: []
             }
          }
          
          const filename = t._file || (t.id ? `${t.id}.md` : null)
          
          projectMap[projName].tasks.push({
            name: t.title,
            filename: filename,
            details: '- ' // default empty item line
          })
        })
        
        reportData.value = Object.values(projectMap)
      } else {
        // Fallback UI
        reportData.value = [
          { name: 'NO ACTIVE PROJECTS', id: null, tasks: [{ name: '', filename: null, details: '' }] }
        ]
      }
    }
  } catch (err) {
    console.error("Failed to load tasks for payload preview:", err)
  } finally {
    isInitializing.value = false
    console.log('[Report] Initialization complete.')
  }
})

watch(webhookUrl, async (newVal) => {
  if (isInitializing.value) return
  
  let finalUrl = newVal
  if (window.electronAPI && window.electronAPI.encryptString) {
    finalUrl = await window.electronAPI.encryptString(newVal)
  }
  localStorage.setItem('googleChatWebhook', finalUrl)
})
</script>
