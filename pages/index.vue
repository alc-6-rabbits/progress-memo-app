<template>
  <div class="h-full flex gap-6 overflow-hidden">
    <!-- LEFT PANEL: Projects and Tasks List -->
    <div class="w-1/3 flex h-full glass-panel overflow-hidden border-l-4 border-l-ace-highlight relative">
      
      <!-- Vertical Sidebar (Tabs) -->
      <div 
        class="flex flex-col h-full bg-[#050c14] border-r border-ace-border/50 z-20 transition-all duration-300 ease-in-out shrink-0 absolute left-0 top-0 bottom-0"
        :class="sidebarExpanded ? 'w-48 shadow-[5px_0_15px_rgba(0,0,0,0.8)]' : 'w-12'"
        @mouseenter="sidebarExpanded = true"
        @mouseleave="sidebarExpanded = false"
      >
        <!-- Sidebar Header (Toggle button area, though handled by hover now, keep for visual balance or manual click if preferred) -->
        <div class="h-14 flex items-center justify-center border-b border-white/10 shrink-0 cursor-pointer text-ace-highlight hover:bg-white/5" @click="sidebarExpanded = !sidebarExpanded">
           <svg v-if="sidebarExpanded" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
           <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </div>

        <!-- Tab List -->
        <div class="flex-grow flex flex-col pt-4 space-y-2 px-2 overflow-y-auto overflow-x-hidden">
          <button 
            v-for="tab in tabs" 
            :key="tab.value"
            @click="selectTab(tab.value)"
            class="flex items-center space-x-3 w-full py-3 px-2 rounded-sm transition-all duration-200"
            :class="currentTab === tab.value ? 'bg-ace-highlight text-ace-bg font-bold' : 'text-ace-text hover:bg-white/10 hover:text-white'"
            :title="tab.label"
          >
            <!-- Icons -->
            <div class="shrink-0 flex items-center justify-center w-5">
              <!-- In Progress (Clock) -->
              <svg v-if="tab.value === 'inProgress'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <!-- Icebox (Box) -->
              <svg v-else-if="tab.value === 'icebox'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              <!-- Archived (Album/Archive) -->
              <svg v-else-if="tab.value === 'archived'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
            </div>
            
            <span class="text-xs tracking-widest whitespace-nowrap opacity-100 transition-opacity duration-200" :class="{ 'opacity-0 w-0 hidden': !sidebarExpanded }">
              {{ tab.label.toUpperCase() }}
            </span>
          </button>

          <NuxtLink 
            to="/import-github" 
            class="flex items-center space-x-3 w-full py-3 px-2 rounded-sm transition-all duration-200 text-ace-highlight hover:bg-ace-highlight hover:text-ace-bg border border-transparent"
            :class="{ 'border-ace-highlight/30': !sidebarExpanded }"
            title="Import from GitHub"
          >
            <!-- GitHub/Cat Icon -->
            <div class="shrink-0 flex items-center justify-center w-5">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/></svg>
            </div>
            <span class="text-xxs font-bold tracking-widest whitespace-nowrap opacity-100 transition-opacity duration-200" :class="{ 'opacity-0 w-0 hidden': !sidebarExpanded }">
              FROM GITHUB
            </span>
          </NuxtLink>
        </div>
      </div>

      <!-- Task List Area -->
      <!-- Added left margin equivalent to the collapsed sidebar width (12 units = 3rem = 48px) -->
      <div class="flex-grow flex flex-col ml-12 overflow-hidden bg-black/20">
        <!-- Header -->
        <div class="p-4 border-b border-white/10 shrink-0 h-14 flex items-center justify-between">
          <h2 class="text-sm font-bold tracking-widest text-ace-title drop-shadow-title">>> {{ currentTab.toUpperCase() }} TARGETS</h2>
          <div class="flex items-center space-x-4">
            <!-- Icebox Toggle (only show when icebox is selected) -->
            <label v-if="currentTab === 'icebox'" class="flex items-center space-x-2 cursor-pointer group">
              <input type="checkbox" v-model="showStaleIcebox" class="form-checkbox bg-transparent border-ace-border text-ace-highlight focus:ring-ace-highlight w-3 h-3">
              <span class="text-xs text-ace-text font-mono group-hover:text-ace-highlight tracking-widest">>30 DAYS</span>
            </label>
            <button @click="refresh" class="text-ace-highlight hover:text-white text-xs font-mono font-bold whitespace-nowrap transition-colors" title="Reload from Disk">[ RELOAD ]</button>
          </div>
        </div>

        <!-- List -->
        <div class="flex-grow overflow-y-auto p-4 space-y-4">
          <div v-if="pending" class="text-center py-4 font-mono text-xs text-ace-highlight animate-pulse tracking-widest">
            SCANNING...
          </div>
          <div v-else-if="groupedTasks.length === 0" class="text-center py-4 font-mono text-xs text-ace-text tracking-widest">
            NO SIGNALS DETECTED.
          </div>
          
          <div v-else v-for="group in groupedTasks" :key="group.name" class="mb-4">
            <h3 class="text-xs font-bold text-ace-highlight border-b border-ace-border/30 pb-1 mb-2 flex items-center cursor-pointer hover:bg-white/5" @click="toggleProject(group.name)">
              <span class="mr-2">{{ expandedProjects.includes(group.name) ? '▼' : '▶' }}</span>
              <span class="bg-ace-highlight text-ace-bg px-1 mr-2 tracking-widest">{{ group.name === 'Inbox' ? 'UNCLASSIFIED' : 'PJ' }}</span>
              {{ group.name }}
            </h3>
            
            <ul v-show="expandedProjects.includes(group.name)" class="space-y-1 pl-4 border-l border-ace-border/30 ml-2">
              <li v-for="task in group.tasks" :key="task._path">
                <button 
                  @click="selectedTask = task; isEditing = false"
                  :class="[
                    'w-full text-left text-xs font-mono py-2 px-2 transition-colors border-l-2',
                    selectedTask?._path === task._path 
                      ? 'bg-ace-highlight/20 border-ace-highlight text-white' 
                      : 'border-transparent text-ace-text hover:bg-white/5 hover:border-ace-text'
                  ]"
                >
                  {{ task.title }}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- RIGHT PANEL: Task Details / Editor -->
    <div class="w-2/3 flex flex-col h-full relative">
      <div v-if="!selectedTask" class="flex-grow glass-panel flex flex-col items-center justify-center opacity-50">
        <div class="w-16 h-16 border-2 border-ace-highlight rounded-full animate-ping opacity-20 absolute"></div>
        <div class="text-center z-10 font-mono tracking-widest">
          <p class="text-ace-title drop-shadow-title mb-2">>> WAITING FOR SELECTION</p>
          <p class="text-xs text-ace-text">SELECT A TARGET FROM THE DATALINK TO VIEW DETAILS</p>
        </div>
      </div>
      
      <div v-else class="flex-grow flex flex-col glass-panel overflow-hidden border-t-2 border-t-ace-highlight">
        <!-- Detail Header -->
        <div class="p-6 border-b border-ace-border/30 shrink-0 bg-black/20">
          <div class="flex justify-between items-start mb-3">
            <h2 class="text-2xl font-bold text-white tracking-wide drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">{{ selectedTask.title }}</h2>
            <div class="flex space-x-2 shrink-0">
              <button v-if="currentTab !== 'archived'" @click="toggleEdit" class="ace-button text-xxs border-ace-text hover:bg-ace-highlight hover:text-ace-bg">
                >> EDIT CONTENT
              </button>
            </div>
          </div>
          <div class="flex items-center space-x-6 text-xxs text-ace-text font-mono">
            <span class="bg-ace-bg border border-ace-border px-2 text-ace-highlight">PJ: {{ selectedTask.project_name || 'UNCLASSIFIED' }}</span>
            <span v-if="selectedTask.issue">
              <span v-if="!selectedTask.issue_url" class="border-b border-gray-600 pb-0.5">REF# {{ selectedTask.issue }}</span>
              <a v-else :href="selectedTask.issue_url" target="_blank" class="border-b border-ace-highlight pb-0.5 text-ace-highlight hover:text-white transition-colors">REF# {{ selectedTask.issue }} ↗</a>
            </span>
            <span class="border-b border-gray-600 pb-0.5">UPDATED: {{ new Date(selectedTask.updated_at).toLocaleString() }}</span>
          </div>
        </div>

        <div class="flex-grow overflow-y-auto p-6 relative" ref="detailContainer">
          <!-- View Mode (Markdown Rendered) -->
          <div class="prose prose-invert prose-sm max-w-none prose-headings:font-mono prose-headings:text-ace-highlight prose-a:text-ace-highlight prose-blockquote:border-ace-border prose-blockquote:bg-ace-bg/30 prose-blockquote:px-4 prose-blockquote:py-1 prose-pre:bg-[#071526] prose-pre:border prose-pre:border-ace-border/30 font-sans" v-html="renderMarkdown(selectedTask.body)">
          </div>
        </div>

        <!-- Action Footer -->
        <div class="p-4 border-t border-ace-border/30 shrink-0 flex space-x-3 bg-black/20">
            <button @click="moveTo(selectedTask, 'inProgress')" v-if="currentTab !== 'inProgress'" class="ace-button ace-button-primary px-3 text-xxs">>> {{ currentTab === 'archived' ? 'RESTORE: IN PROGRESS' : 'SET: IN PROGRESS' }}</button>
            <button @click="moveTo(selectedTask, 'icebox')" v-if="currentTab !== 'icebox'" class="ace-button ace-button-warning px-3 text-xxs">>> {{ currentTab === 'archived' ? 'RESTORE: ICEBOX' : 'SET: ICEBOX' }}</button>
            <button @click="moveTo(selectedTask, 'archived')" v-if="currentTab !== 'archived'" class="ace-button border-red-500 text-red-400 hover:bg-red-500 hover:text-white px-3 text-xxs ml-auto">>> ARCHIVE TARGET</button>
        </div>
      </div>
    </div>
    <!-- FULL SCREEN EDITOR OVERLAY -->
    <div v-if="isEditing" class="fixed inset-0 z-50 bg-ace-bg/95 backdrop-blur-sm flex flex-col font-mono">
      <!-- Editor Header -->
      <div class="flex-none p-4 border-b border-ace-highlight/50 flex justify-between items-center bg-black/40">
        <div class="flex flex-col space-y-2 w-1/2">
          <div class="flex items-center space-x-2">
            <span class="text-xs text-ace-highlight tracking-widest w-16">TITLE:</span>
            <input v-model="editTitle" type="text" class="flex-grow bg-transparent border-b border-ace-border px-2 text-lg font-bold text-white focus:outline-none focus:border-ace-highlight">
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-xs text-ace-highlight tracking-widest w-16">PROJECT:</span>
            <input v-model="editProject" list="index-projects-list" type="text" class="bg-transparent border-b border-ace-border px-2 text-xs text-white focus:outline-none w-48">
          </div>
        </div>
        <div class="flex items-center space-x-4">
          <button @click="isEditing = false" class="text-ace-text hover:text-white transition-colors text-xs tracking-widest">[ DISCARD ]</button>
          <button @click="saveEdit" class="ace-button ace-button-primary px-6" :disabled="savingEdit">
             {{ savingEdit ? 'UPLOADING...' : 'COMMIT CHANGES >>' }}
          </button>
        </div>
      </div>

      <!-- Editor Body (2 Columns) -->
      <div class="flex-grow flex overflow-hidden">
        <!-- Left Column: Toolbar + Textarea -->
        <div class="w-1/2 flex flex-col border-r border-ace-highlight/30">
          <div class="flex-none bg-ace-panel p-2 flex space-x-2 border-b border-ace-border/50 overflow-x-auto">
            <button @click="insertMarkdown('# ', '')" class="w-8 h-8 flex items-center justify-center text-xs text-ace-text hover:bg-ace-highlight hover:text-black border border-ace-border rounded-sm font-bold" title="Heading 1">H1</button>
            <button @click="insertMarkdown('## ', '')" class="w-8 h-8 flex items-center justify-center text-xs text-ace-text hover:bg-ace-highlight hover:text-black border border-ace-border rounded-sm font-bold" title="Heading 2">H2</button>
            <button @click="insertMarkdown('### ', '')" class="w-8 h-8 flex items-center justify-center text-xs text-ace-text hover:bg-ace-highlight hover:text-black border border-ace-border rounded-sm font-bold" title="Heading 3">H3</button>
            <div class="w-px h-6 bg-ace-border/50 self-center mx-1"></div>
            <button @click="insertMarkdown('**', '**')" class="w-8 h-8 flex items-center justify-center text-xs text-ace-text hover:bg-ace-highlight hover:text-black border border-ace-border rounded-sm font-bold" title="Bold">B</button>
            <button @click="insertMarkdown('*', '*')" class="w-8 h-8 flex items-center justify-center text-xs text-ace-text hover:bg-ace-highlight hover:text-black border border-ace-border rounded-sm italic" title="Italic">I</button>
            <div class="w-px h-6 bg-ace-border/50 self-center mx-1"></div>
            <button @click="insertMarkdown('> ', '')" class="w-8 h-8 flex items-center justify-center text-xs text-ace-text hover:bg-ace-highlight hover:text-black border border-ace-border rounded-sm" title="Quote">”</button>
            <button @click="insertMarkdown('\n```\n', '\n```\n')" class="w-8 h-8 flex items-center justify-center text-xs text-ace-text hover:bg-ace-highlight hover:text-black border border-ace-border rounded-sm font-mono" title="Code Block">&lt;/&gt;</button>
            <button @click="insertMarkdown('[', '](url)')" class="w-8 h-8 flex items-center justify-center text-xs text-ace-text hover:bg-ace-highlight hover:text-black border border-ace-border rounded-sm font-mono" title="Link">⏏</button>
            <div class="w-px h-6 bg-ace-border/50 self-center mx-1"></div>
            <button @click="insertMarkdown('- ', '')" class="w-8 h-8 flex items-center justify-center text-xs text-ace-text hover:bg-ace-highlight hover:text-black border border-ace-border rounded-sm font-bold" title="Unordered List">•</button>
            <button @click="insertMarkdown('1. ', '')" class="w-8 h-8 flex items-center justify-center text-xs text-ace-text hover:bg-ace-highlight hover:text-black border border-ace-border rounded-sm font-bold" title="Ordered List">1.</button>
            <button @click="insertMarkdown('- [ ] ', '')" class="w-8 h-8 flex items-center justify-center text-xs text-ace-text hover:bg-ace-highlight hover:text-black border border-ace-border rounded-sm font-bold border-dashed" title="Task List">☑</button>
          </div>
          <textarea 
            ref="editorTextarea"
            v-model="editContent" 
            class="flex-grow w-full bg-black/40 p-4 text-sm font-sans text-white focus:outline-none resize-none leading-relaxed"
            placeholder="Write markdown here..."
            @select="updateSelection"
            @keyup="updateSelection"
            @click="updateSelection"
          ></textarea>
        </div>
        
        <!-- Right Column: Real-time Preview -->
        <div class="w-1/2 p-6 overflow-y-auto bg-[#050c14] relative" ref="previewContainer">
          <div class="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] z-0"></div>
          <div class="relative z-10 prose prose-invert prose-sm max-w-none prose-headings:font-mono prose-headings:text-ace-highlight prose-a:text-ace-highlight prose-blockquote:border-ace-border prose-blockquote:bg-ace-bg/30 prose-blockquote:px-4 prose-blockquote:py-1 prose-pre:bg-[#071526] prose-pre:border prose-pre:border-ace-border/30 font-sans" v-html="renderMarkdown(editContent)"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { marked } from 'marked'

const router = useRouter()

const tabs = [
  { label: 'In Progress', value: 'inProgress' },
  { label: 'Icebox', value: 'icebox' },
  { label: 'Archived', value: 'archived' }
]

const currentTab = ref('inProgress')
const showStaleIcebox = ref(false)
const allTasks = ref([])
const pending = ref(true)
const projectsData = ref({ project: {} })
const sidebarExpanded = ref(false)

// Selection & Editing state
const selectedTask = ref(null)
const expandedProjects = ref([])
const isEditing = ref(false)
const editTitle = ref('')
const editProject = ref('')
const editContent = ref('')
const savingEdit = ref(false)
const editorTextarea = ref(null)
const previewContainer = ref(null)
const detailContainer = ref(null)

const selectionStart = ref(0)
const selectionEnd = ref(0)

const selectTab = (val) => {
  currentTab.value = val
  selectedTask.value = null
  isEditing.value = false
}

const toggleProject = (projectName) => {
  if (expandedProjects.value.includes(projectName)) {
    expandedProjects.value = expandedProjects.value.filter(p => p !== projectName)
  } else {
    expandedProjects.value.push(projectName)
  }
}

const toggleEdit = () => {
  if (!isEditing.value) {
    editTitle.value = selectedTask.value.title
    editProject.value = selectedTask.value.project_name || 'Inbox'
    editContent.value = selectedTask.value.body
    
    // Auto focus textarea
    setTimeout(() => {
      if (editorTextarea.value) editorTextarea.value.focus()
      applyAccordionLogic()
    }, 100)
  }
  isEditing.value = !isEditing.value
}

const applyAccordionLogic = () => {
  const containers = [previewContainer.value, detailContainer.value].filter(Boolean);
  
  containers.forEach(container => {
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
    // Only bind once
    if (heading.dataset.accordionBound) return;
    heading.dataset.accordionBound = "true";
    
    heading.style.cursor = 'pointer';
    heading.style.display = 'flex';
    heading.style.alignItems = 'center';
    
    const indicator = document.createElement('span');
    indicator.textContent = '▼';
    indicator.style.marginRight = '8px';
    indicator.style.fontSize = '0.8em';
    indicator.style.transition = 'transform 0.2s';
    
    // Check if it already has one to prevent duplication on re-renders, 
    // actually renderMarkdown recreates DOM so it's fine
    heading.insertBefore(indicator, heading.firstChild);
    
    heading.addEventListener('click', () => {
      const level = parseInt(heading.tagName.substring(1));
      let current = heading.nextElementSibling;
      let isCollapsed = heading.dataset.collapsed === "true";
      
      // Toggle state
      isCollapsed = !isCollapsed;
      heading.dataset.collapsed = isCollapsed ? "true" : "false";
      indicator.style.transform = isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
      
      while (current) {
        // Stop if we hit a heading of the same or higher level (smaller number)
        if (current.tagName.match(/^H[1-6]$/)) {
          const currentLevel = parseInt(current.tagName.substring(1));
          if (currentLevel <= level) break;
        }
        
        current.style.display = isCollapsed ? 'none' : '';
        current = current.nextElementSibling;
      }
    });
  });
  });
}

// Watch for content changes to re-apply accordion logic to new elements
watch(editContent, () => {
  if (isEditing.value) {
    setTimeout(applyAccordionLogic, 50); // wait for DOM update
  }
})

// Watch for selectedTask changes to apply accordion to detail view
watch(selectedTask, () => {
  if (selectedTask.value && !isEditing.value) {
    setTimeout(applyAccordionLogic, 50);
  }
})

const updateSelection = (e) => {
  selectionStart.value = e.target.selectionStart
  selectionEnd.value = e.target.selectionEnd
}

const insertMarkdown = (prefix, suffix) => {
  if (!editorTextarea.value) return
  
  const text = editContent.value
  const start = selectionStart.value
  const end = selectionEnd.value
  const selectedText = text.substring(start, end)
  
  const insertText = prefix + selectedText + suffix
  
  editContent.value = text.substring(0, start) + insertText + text.substring(end)
  
  // Restore focus and cursor position after Vue updates
  setTimeout(() => {
    if (editorTextarea.value) {
      editorTextarea.value.focus()
      const newCursorPos = start + prefix.length + selectedText.length
      editorTextarea.value.setSelectionRange(newCursorPos, newCursorPos)
      updateSelection({ target: editorTextarea.value })
    }
  }, 0)
}

const saveEdit = async () => {
  if (!selectedTask.value) return
  savingEdit.value = true
  try {
    const filename = selectedTask.value._file || selectedTask.value._path?.split(/[\\/]/).pop() || `${selectedTask.value.id}.md`
    
    // Actually, we created saveMarkdown which expects Frontmatter obj and Content body separate!
    // Wait, let's pass the existing frontmatter back.
    if (window.electronAPI && window.electronAPI.saveMarkdown) {
      const customDir = localStorage.getItem('tasksDir') || undefined
      
      // Resolve project ID and Name
      let matchedId = null
      const inputName = editProject.value || '未分類'
      for (const [id, proj] of Object.entries(projectsData.value.project)) {
        if (proj.name === inputName) {
          matchedId = id
          break
        }
      }
      
      if (!matchedId) {
        const ids = Object.keys(projectsData.value.project).map(Number).filter(n => !isNaN(n))
        matchedId = String(ids.length > 0 ? Math.max(...ids) + 1 : 1)
        projectsData.value.project[matchedId] = { name: inputName }
        await window.electronAPI.saveProjects(projectsData.value, customDir)
      }

      const fullContent = `---
id: "${selectedTask.value.id || ''}"
title: "${editTitle.value.replace(/"/g, '\\"')}"
project_id: "${matchedId}"
project_name: "${inputName.replace(/"/g, '\\"')}"
issue: ${selectedTask.value.issue || null}
status: "${selectedTask.value.status}"
created_at: "${selectedTask.value.created_at || new Date().toISOString()}"
updated_at: "${new Date().toISOString()}"
---

${editContent.value}
`
      
      const response = await window.electronAPI.saveMarkdown(filename, fullContent, customDir)
      
      if (response.success) {
        selectedTask.value.title = editTitle.value
        selectedTask.value.project_id = matchedId
        selectedTask.value.project_name = inputName
        selectedTask.value.body = editContent.value
        selectedTask.value.updated_at = new Date().toISOString()
        isEditing.value = false
        await refresh() // Refetch everything
      } else {
        alert('Failed to save edits: ' + response.error)
      }
    }
  } catch (err) {
    console.error(err)
    alert('Error saving edit.')
  } finally {
    savingEdit.value = false
  }
}

const refresh = async () => {
    pending.value = true
    try {
        if (window.electronAPI && window.electronAPI.getAllMarkdowns) {
            const customDir = localStorage.getItem('tasksDir') || undefined
            
            // Also fetch projects datalink
            if (window.electronAPI.getProjects) {
              const pData = await window.electronAPI.getProjects(customDir)
              if (pData && pData.project) projectsData.value = pData
            }

            const data = await window.electronAPI.getAllMarkdowns(customDir)
            
            // Keep all tasks (including archived), sort by updated_at desc
            allTasks.value = data
              .sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
            
            // Auto expand newly discovered projects
            const existingGroups = new Set(allTasks.value.map(t => t.project_name || 'Inbox'))
            existingGroups.forEach(g => {
              if (!expandedProjects.value.includes(g)) expandedProjects.value.push(g)
            })
            
            // Re-bind selected Task reference if it existed
            if (selectedTask.value) {
                const refreshed = allTasks.value.find(t => t._path === selectedTask.value._path)
                selectedTask.value = refreshed || null
            }
        }
    } catch (err) {
        console.error('Error fetching markdowns:', err)
    } finally {
        pending.value = false
    }
}

onMounted(() => {
    if (!sessionStorage.getItem('appStarted')) {
        sessionStorage.setItem('appStarted', 'true')
        const startup = localStorage.getItem('startupScreen')
        if (startup === 'report') {
            router.replace('/report')
            return
        }
    }
    refresh()
})

const renderMarkdown = (text) => {
    if (!text) return ''
    return marked(text)
}

const filteredTasks = computed(() => {
  if (!allTasks.value) return []
  
  let filtered = allTasks.value.filter(t => t.status === currentTab.value)
  
  // Apply 30-day filter for icebox
  if (currentTab.value === 'icebox' && !showStaleIcebox.value) {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    filtered = filtered.filter(t => {
      const updatedDate = new Date(t.updated_at || t.created_at)
      return updatedDate >= thirtyDaysAgo
    })
  }
  
  return filtered
})

const groupedTasks = computed(() => {
  const groups = {}
  filteredTasks.value.forEach(t => {
    const p = t.project_name || 'Inbox'
    if (!groups[p]) groups[p] = []
    groups[p].push(t)
  })
  
  return Object.keys(groups).map(k => {
    return { name: k, tasks: groups[k] }
  }).sort((a,b) => {
    if (a.name === 'Inbox') return 1 // Inbox at the bottom
    if (b.name === 'Inbox') return -1
    return a.name.localeCompare(b.name)
  })
})

const moveTo = async (task, newStatus) => {
  try {
      const filename = task._file || task._path?.split(/[\\/]/).pop() || `${task.id}.md`
      if (window.electronAPI && window.electronAPI.updateMarkdownStatus) {
        const customDir = localStorage.getItem('tasksDir') || undefined
        const response = await window.electronAPI.updateMarkdownStatus(filename, newStatus, customDir)
        if (response.success) {
           await refresh()
           selectedTask.value = null
        } else {
           alert('Failed to update status: ' + response.error)
        }
      }
  } catch (error) {
      console.error(error)
  }
}
</script>
