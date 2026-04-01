<template>
  <div class="h-full w-full flex flex-row overflow-hidden relative">

    <!-- Tasks List Sidebar -->
    <aside class="w-80 flex-none border-r border-tcc-border/30 bg-tcc-panel/20 flex flex-col h-full overflow-hidden">
       <div class="p-4 border-b border-tcc-border/20 text-[10px] tracking-widest opacity-60 uppercase font-bold flex justify-between items-center">
         <span>Target List</span>
         <button @click="refresh" class="hover:text-tcc-hi transition-colors">↻</button>
       </div>
       <div v-if="pending" class="px-4 py-6 text-center text-[10px] text-tcc-hi animate-pulse tracking-widest">
         SCANNING DATALINK...
       </div>
       <div v-else class="flex-grow overflow-y-auto custom-scrollbar">
         <div v-for="task in sortedTasks" :key="task.id" 
              @click="selectTask(task)"
              class="task-item" 
              :class="{ 'active': activeTask && activeTask.id === task.id }">
            <div class="flex-grow min-w-0">
               <div class="text-[12px] truncate" :class="activeTask && activeTask.id === task.id ? 'text-white font-bold' : 'text-tcc-text'">
                 {{ task.title }}
               </div>
               <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                 <span v-if="task.priority" class="tag text-[8px]" :class="'badge-' + (task.priority || 'medium').toLowerCase()">{{ (task.priority || 'Medium').substring(0, 1).toUpperCase() }}</span>
                 <span class="tag text-[8px]" :class="'badge-' + getStatusBadge(task.status)">{{ getStatusName(task.status) }}</span>
                 <span class="text-[9px] text-tcc-border ml-auto truncate">{{ task.project_name || 'UNCLASSIFIED' }}</span>
               </div>
            </div>
         </div>
         <div v-if="sortedTasks.length === 0" class="text-center p-6 text-xs text-tcc-text opacity-50">NO TARGETS IN DATABASE</div>
       </div>
    </aside>

    <!-- Editor/Preview Area -->
    <div class="flex-grow flex flex-col h-full overflow-hidden bg-tcc-bg/50 relative">
       
       <div v-if="!activeTask" class="flex-grow flex items-center justify-center text-tcc-text opacity-30 text-xs tracking-widest">
         >> SELECT TARGET FROM LEFT PANEL 
       </div>
       
       <template v-else>
         <!-- Header -->
         <div class="flex-none p-6 border-b border-tcc-border/30 bg-tcc-panel/40 flex justify-between items-center">
            <div class="min-w-0 flex-grow pr-4">
               <h1 class="text-xl text-tcc-hi font-bold glow-blue tracking-wider truncate">{{ activeTask.title }}</h1>
               <p class="text-[10px] text-tcc-text opacity-50 mt-1 uppercase tracking-widest truncate">Target ID: {{ activeTask.issue ? '#' + activeTask.issue : activeTask.id }} // Status: {{ getStatusName(activeTask.status) }}</p>
            </div>
            <div class="flex gap-3 flex-none">
               <button v-if="!isEditing" @click="toggleEdit" class="btn btn-primary px-6">> EDIT CONTENT</button>
               <button v-else @click="saveChanges" class="btn text-[#f59e0b] border-[#f59e0b] hover:bg-[#f59e0b] hover:text-tcc-bg px-8" :disabled="isSaving">
                 {{ isSaving ? 'UPLOADING...' : '[ SAVE CHANGES ]' }}
               </button>
               <button class="btn border border-tcc-border/40 text-tcc-text hover:border-tcc-warn hover:text-tcc-warn transition-colors" @click="toggleProperties" :class="{'bg-tcc-warn/20 text-tcc-warn border-tcc-warn/50': showProperties}">⚙ PROPERTIES</button>
            </div>
         </div>

         <!-- Content Area -->
         <div class="flex-grow flex overflow-hidden relative">
            
            <!-- EDITOR PANEL -->
            <div v-show="isEditing" class="w-1/2 flex-none border-r border-tcc-border/30 bg-black/20 flex flex-col relative transition-all duration-300">
               <div class="flex-none bg-tcc-panel/60 px-4 py-2 border-b border-tcc-border/20 flex items-center gap-1.5 overflow-x-auto">
                  <button @click="insertSyntax('**', '**')" class="toolbar-btn font-bold" title="Bold">B</button>
                  <button @click="insertSyntax('_', '_')" class="toolbar-btn italic" title="Italic">I</button>
                  <button @click="insertSyntax('~~', '~~')" class="toolbar-btn line-through" title="Strikethrough">S</button>
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
               </div>
               <textarea ref="editorTextarea" v-model="editContent" class="editor-textarea custom-scrollbar border-0 flex-grow" placeholder="Enter tactical intelligence..."></textarea>
               
               <!-- Visual divider when sliding properties open -->
               <div v-if="showProperties" class="absolute inset-0 bg-black/50 z-10 pointer-events-none"></div>
            </div>

            <!-- PREVIEW PANEL -->
            <div class="flex-grow p-8 overflow-y-auto custom-scrollbar relative" :class="!isEditing ? 'w-full' : 'w-1/2'">
               <div class="max-w-3xl mx-auto flex flex-col pb-16">
                 <!-- Accordion-aware preview sections -->
                 <template v-for="(section, idx) in parsedSections" :key="idx">
                   
                   <!-- H2 Section with accordion -->
                   <div v-if="section.type === 'h2'" class="my-4">
                     <button
                       @click="toggleSection(idx)"
                       class="w-full flex items-center gap-3 text-left group"
                     >
                       <span class="text-tcc-hi/40 group-hover:text-tcc-hi transition-colors text-lg font-bold leading-none">
                         {{ collapsedSections[idx] ? '▶' : '▼' }}
                       </span>
                       <div class="flex-grow border-l-4 border-tcc-hi/40 pl-4 border-b border-tcc-border/10 pb-2">
                         <h2 class="text-tcc-hi text-lg font-bold tracking-widest group-hover:text-white transition-colors">
                           {{ section.text }}
                         </h2>
                       </div>
                     </button>
                     <div v-show="!collapsedSections[idx]" class="pl-10 mt-3 border-l border-tcc-border/20 ml-3" v-html="renderMarkdown(section.content)">
                     </div>
                   </div>
                   
                   <!-- H1 Section -->
                   <div v-else-if="section.type === 'h1'" class="mb-4">
                     <h1 class="text-2xl text-tcc-hi font-bold tracking-widest pb-2 border-b border-tcc-hi/20">
                       {{ section.text }}
                     </h1>
                   </div>
                   
                   <!-- Plain content block -->
                   <div v-else class="text-sm text-tcc-text leading-relaxed" v-html="renderMarkdown(section.content)">
                   </div>
                   
                 </template>
                 <div v-if="parsedSections.length === 0" class="opacity-30 italic text-sm text-tcc-text">No tactical data...</div>
               </div>
               
               <!-- Overlay blocker when properties open -->
               <div v-if="showProperties" class="absolute inset-0 bg-black/50 z-10 pointer-events-none"></div>
            </div>
         </div>

         <!-- Properties Sliding Panel -->
         <Transition name="slide">
           <div v-if="showProperties" class="absolute top-0 right-0 bottom-0 w-80 bg-tcc-panel border-l border-tcc-border shadow-2xl z-50 flex flex-col p-6 overflow-y-auto custom-scrollbar">
              <div class="flex justify-between items-center border-b border-tcc-border/30 pb-3 mb-6 font-bold text-tcc-hi">
                 <span class="text-xs">METADATA CONFIG</span>
                 <button class="text-tcc-text hover:text-white transition-colors" @click="toggleProperties">[ X ]</button>
              </div>
              <div class="space-y-5 text-xs flex-grow">
                 
                 <div class="space-y-1">
                    <label class="opacity-50 font-bold uppercase">Target Identifier</label>
                    <input v-model="editData.title" type="text" class="w-full bg-black/40 border border-tcc-border/40 p-2 text-tcc-hi outline-none focus:border-tcc-hi transition-colors">
                 </div>

                 <div class="space-y-1">
                    <label class="opacity-50 font-bold uppercase">Status</label>
                    <select v-model="editData.status" class="w-full bg-black/40 border border-tcc-border/40 p-2 text-tcc-hi outline-none focus:border-tcc-hi cursor-pointer">
                      <option value="todo">TODO (PENDING)</option>
                      <option value="in-progress">ENGAGED (ACTIVE)</option>
                      <option value="done">COMPLETED (DONE)</option>
                      <option value="icebox">ICEBOX (ON HOLD)</option>
                    </select>
                 </div>
                 
                 <div class="space-y-1">
                    <label class="opacity-50 font-bold uppercase">Priority</label>
                    <select v-model="editData.priority" class="w-full bg-black/40 border border-tcc-border/40 p-2 text-tcc-hi outline-none focus:border-tcc-hi cursor-pointer">
                      <option value="High">HIGH (CRITICAL)</option>
                      <option value="Medium">MEDIUM (STANDARD)</option>
                      <option value="Low">LOW (STANDBY)</option>
                    </select>
                 </div>

                 <div class="space-y-1">
                    <label class="opacity-50 font-bold uppercase">Project Designation</label>
                    <input v-model="editData.project_name" type="text" list="proj-list" class="w-full bg-black/40 border border-tcc-border/40 p-2 text-tcc-hi outline-none focus:border-tcc-hi transition-colors" placeholder="e.g. SCREEN DEV">
                    <datalist id="proj-list">
                       <option v-for="proj in uniqueProjects" :key="proj" :value="proj"></option>
                    </datalist>
                 </div>

                 <div class="space-y-1 flex gap-4">
                    <div class="flex-grow">
                      <label class="opacity-50 font-bold uppercase">Sub-Issue REF#</label>
                      <input v-model="editData.issue" type="number" class="w-full bg-black/40 border border-tcc-border/40 p-2 text-tcc-hi outline-none focus:border-tcc-hi">
                    </div>
                    <div class="flex-grow">
                      <label class="opacity-50 font-bold uppercase">Parent Issue#</label>
                      <input v-model="editData.parent_issue" type="number" class="w-full bg-black/40 border border-tcc-border/40 p-2 text-tcc-hi outline-none focus:border-tcc-hi">
                    </div>
                 </div>

                 <!-- Display Tags -->
                 <div class="space-y-2 pt-2 border-t border-tcc-border/20">
                    <label class="opacity-50 font-bold uppercase">Tags List</label>
                    <div class="flex flex-wrap gap-2">
                       <span v-for="(tag, idx) in editData.tags" :key="idx" class="tag bg-tcc-panel/50 flex items-center gap-1 group">
                          {{ tag }}
                          <button @click="removeTag(idx)" class="hover:text-tcc-warn opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                       </span>
                    </div>
                    <div class="flex gap-2">
                       <input v-model="newTag" @keyup.enter="addTag" type="text" class="flex-grow bg-transparent border-b border-tcc-border p-1 text-tcc-hi outline-none focus:border-tcc-hi" placeholder="+ Add tag">
                       <button @click="addTag" class="text-tcc-hi text-xs font-bold border border-tcc-border/50 px-2 hover:bg-tcc-hi/20">+</button>
                    </div>
                 </div>

                 <p v-if="propMessage" class="text-tcc-hi animate-pulse mt-4 text-center">{{ propMessage }}</p>

              </div>
              <div class="mt-auto pt-6 flex gap-3 flex-col">
                 <button class="btn btn-primary w-full py-2 bg-tcc-panel border-[#f59e0b] text-[#f59e0b] hover:bg-[#f59e0b] hover:text-tcc-bg" @click="saveChanges">
                    {{ isSaving ? 'UPLOADING...' : '[ APPLY & SAVE CONFIG ]' }}
                 </button>
              </div>
           </div>
         </Transition>
       </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { marked } from 'marked'

const route = useRoute()
const router = useRouter()

const pending = ref(true)
const allTasks = ref([])
const activeTask = ref(null)

const isEditing = ref(false)
const showProperties = ref(false)
const isSaving = ref(false)
const propMessage = ref('')

const editContent = ref('')
const editData = ref({})
const newTag = ref('')
const editorTextarea = ref(null)
const collapsedSections = reactive({})

const refresh = async () => {
  pending.value = true
  try {
    if (window.electronAPI && window.electronAPI.getAllMarkdowns) {
      const data = await window.electronAPI.getAllMarkdowns()
      allTasks.value = data
      
      // Auto-select if newly loaded
      if (!activeTask.value && data.length > 0) {
         if (route.query.new) {
            createNewEmptyTask()
         } else {
            selectTask(data[0])
         }
      } else if (activeTask.value) {
         // Reload the current active task if it was updated
         const updatedTask = data.find(t => t.id === activeTask.value.id || t._file === activeTask.value._file)
         if (updatedTask && !isEditing.value) {
            selectTask(updatedTask)
         }
      }
    }
  } catch (err) {
    console.error('Error fetching markdowns:', err)
  } finally {
    pending.value = false
  }
}

const createNewEmptyTask = () => {
  const newTask = {
    id: `task-${Date.now()}`,
    title: 'NEW UNCLASSIFIED TARGET',
    status: 'todo',
    priority: 'Medium',
    project_name: 'INBOX',
    tags: [],
    body: '## Objective\n\n\n## Action Items\n- [ ] Task 1',
    _file: `task-${Date.now()}.md` // Temporary filename, will be saved using this
  }
  activeTask.value = newTask
  isEditing.value = true
  showProperties.value = true
  editContent.value = newTask.body
  editData.value = { ...newTask }
  allTasks.value.unshift(newTask)
}

onMounted(() => {
  refresh()
})

watch(() => route.query.new, (isNew) => {
  if (isNew) {
    createNewEmptyTask()
  }
})

const sortedTasks = computed(() => {
  return [...allTasks.value].sort((a,b) => {
    // Sort by updated time mostly, but grouped by status if needed
    const timeA = new Date(a.updated_at || 0).getTime()
    const timeB = new Date(b.updated_at || 0).getTime()
    return timeB - timeA
  })
})

const uniqueProjects = computed(() => {
   const set = new Set(allTasks.value.map(t => t.project_name).filter(Boolean))
   return Array.from(set).sort()
})

const selectTask = (task) => {
  if (isEditing.value && activeTask.value && activeTask.value.id !== task.id) {
    if (!confirm('Unsaved changes will be lost. Proceed?')) return
  }
  activeTask.value = task
  isEditing.value = false
  showProperties.value = false
  
  // Clone data for editing
  editContent.value = task.body || task.content || ''
  editData.value = { ...task }
  if (!editData.value.tags) editData.value.tags = []
}

const toggleEdit = () => {
  isEditing.value = !isEditing.value
  if (!isEditing.value) {
     // If user cancels edit gracefully? The wireframe says saving is the toggle off.
     // For now, toggle edit just switches mode. 
  }
}

const toggleProperties = () => {
  showProperties.value = !showProperties.value
}

const addTag = () => {
  const val = newTag.value.trim()
  if (val && !editData.value.tags.includes(val)) {
    editData.value.tags.push(val)
  }
  newTag.value = ''
}
const removeTag = (idx) => {
  editData.value.tags.splice(idx, 1)
}

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
  
  // Restore focus
  setTimeout(() => {
    el.focus()
    el.setSelectionRange(selStart + start.length, selStart + start.length + selected.length)
  }, 0)
}

// --- Accordion-capable parsed sections ---
const parsedSections = computed(() => {
  const raw = isEditing.value ? editContent.value : (activeTask.value ? (activeTask.value.body || activeTask.value.content || '') : '')
  if (!raw) return []
  
  const sections = []
  const lines = raw.split('\n')
  let currentSection = null
  
  for (const line of lines) {
    const h1Match = line.match(/^# (.+)$/)
    const h2Match = line.match(/^## (.+)$/)
    
    if (h1Match) {
      if (currentSection) sections.push(currentSection)
      currentSection = { type: 'h1', text: h1Match[1], content: '' }
    } else if (h2Match) {
      if (currentSection) sections.push(currentSection)
      currentSection = { type: 'h2', text: h2Match[1], content: '' }
    } else {
      if (!currentSection) {
        currentSection = { type: 'body', text: '', content: '' }
      }
      currentSection.content += line + '\n'
    }
  }
  if (currentSection) sections.push(currentSection)
  
  return sections
})

const toggleSection = (idx) => {
  collapsedSections[idx] = !collapsedSections[idx]
}

const renderMarkdown = (raw) => {
  if (!raw || !raw.trim()) return ''
  
  let html = marked(raw)
  html = html.replace(/<h3(.*?)>/g, '<h3 class="text-white font-bold mt-4 mb-2 text-sm tracking-widest">')
  html = html.replace(/<hr(.*?)>/g, '<hr class="border-t border-tcc-border/40 my-4">')
  html = html.replace(/<a /g, '<a class="text-tcc-hi underline hover:text-white" target="_blank" ')
  html = html.replace(/<ul>/g, '<ul class="space-y-2 text-sm pl-4 mb-4 text-tcc-text">')
  html = html.replace(/<ol>/g, '<ol class="space-y-2 text-sm pl-4 mb-4 text-tcc-text list-decimal">')
  html = html.replace(/<li>/g, '<li class="flex items-start gap-2">')
  html = html.replace(/<p>/g, '<p class="text-tcc-text text-sm leading-relaxed mb-3">')
  html = html.replace(/<code>/g, '<code class="bg-black/40 text-tcc-hi px-1 border border-tcc-border/30 font-mono text-xs">')
  html = html.replace(/<pre>/g, '<pre class="bg-black/40 border border-tcc-border/20 p-4 overflow-x-auto text-tcc-hi font-mono text-xs mb-4">')
  
  // Checkbox styles
  html = html.replace(/\[x\] /gi, '<span class="text-green-400 shrink-0 select-none font-mono">[x]</span> <span>')
  html = html.replace(/\[ \] /g, '<span class="text-tcc-text shrink-0 select-none font-mono">[ ]</span> <span>')
  html = html.replace(/<\/li>/g, '</span></li>')
  
  return html
}

const getStatusName = (st) => {
  const s = String(st || '').toLowerCase()
  if (s === 'todo') return 'TODO'
  if (s === 'in-progress' || s === 'inprogress') return 'ENGAGED'
  if (s === 'done' || s === 'archived') return 'COMPLETED'
  if (s === 'icebox') return 'ICEBOX'
  return s.toUpperCase()
}

const getStatusBadge = (st) => {
  const s = String(st || '').toLowerCase()
  if (s === 'todo') return 'todo'
  if (s === 'in-progress' || s === 'inprogress') return 'inprog'
  if (s === 'done' || s === 'archived') return 'done'
  if (s === 'icebox') return 'icebox'
  return 'todo'
}

const saveChanges = async () => {
  if (!activeTask.value) return
  isSaving.value = true
  propMessage.value = ''
  
  try {
     const customDir = localStorage.getItem('tasksDir') || undefined
     
     // 1. Construct YAML block
     const fmKeys = ['id', 'title', 'project_id', 'project_name', 'issue', 'parent_issue', 'status', 'priority', 'created_at']
     let fmStr = '---\n'
     for (const key of fmKeys) {
       if (editData.value[key] !== undefined && editData.value[key] !== null && editData.value[key] !== '') {
         // Sanitize quotes in strings
         if (typeof editData.value[key] === 'string') {
           fmStr += `${key}: "${editData.value[key].replace(/"/g, '\\"')}"\n`
         } else {
           fmStr += `${key}: ${editData.value[key]}\n`
         }
       }
     }
     
     // Arrays
     if (editData.value.tags && editData.value.tags.length > 0) {
       const tagsArr = editData.value.tags.map(t => `"${t.replace(/"/g, '\\"')}"`).join(', ')
       fmStr += `tags: [${tagsArr}]\n`
     }
     
     fmStr += `updated_at: "${new Date().toISOString()}"\n---\n\n`
     fmStr += editContent.value
     
     // Determine filename (use existing _file if available, else derive from ID)
     let filename = activeTask.value._file
     if (!filename) {
        filename = editData.value.id + '.md'
     }
     
     const response = await window.electronAPI.saveMarkdown(filename, fmStr, customDir)
     
     if (response.success) {
        propMessage.value = 'DATA UPLOADED.'
        isEditing.value = false
        showProperties.value = false
        setTimeout(() => propMessage.value = '', 3000)
        await refresh() // Reload to sync state
        // Remove /new query param if it exists
        if (route.query.new) {
           router.replace('/tasks')
        }
     } else {
        alert('SAVE FAILED: ' + response.error)
     }
  } catch (err) {
    console.error(err)
    alert('ERROR: ' + err.message)
  } finally {
    isSaving.value = false
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
  transition: colors 0.2s;
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

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
