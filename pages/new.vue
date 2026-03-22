<template>
  <div class="h-full w-full glass-panel relative group overflow-hidden flex flex-col items-center p-8">
    <div class="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-ace-highlight m-4 opacity-50"></div>
    <div class="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-ace-highlight m-4 opacity-50"></div>
    
    <div class="w-full max-w-5xl flex flex-col h-full relative z-10">
      <div class="flex justify-between items-center mb-8 border-b border-white/20 pb-4 shrink-0">
        <h1 class="text-2xl font-mono tracking-widest text-ace-title drop-shadow-title">>> NEW TARGET DATA</h1>
        <NuxtLink to="/" class="text-ace-text hover:text-ace-highlight font-mono tracking-widest text-sm">[ CANCEL & RTB ]</NuxtLink>
      </div>

      <div class="flex-grow overflow-y-auto pr-4">
        <form @submit.prevent="saveTask" class="space-y-6 font-mono">
          <div class="grid grid-cols-2 gap-6">
        <div>
          <label class="block text-xs tracking-widest text-ace-text mb-2">PROJECT DESIGNATION</label>
          <input v-model="form.project" list="projects-list" type="text" class="block w-full ace-input bg-ace-bg/30 p-2 border border-ace-border focus:border-ace-highlight focus:ring-1 focus:ring-ace-highlight transition-all" placeholder="e.g. SmartMart">
          <datalist id="projects-list">
            <option v-for="[id, proj] in Object.entries(projectsData.project)" :key="id" :value="proj.name"></option>
          </datalist>
        </div>

        <div>
          <label class="block text-xs tracking-widest text-ace-text mb-2">ISSUE REF NO.</label>
          <input v-model="form.issue" type="number" class="block w-full ace-input bg-ace-bg/30 p-2 border border-ace-border focus:border-ace-highlight focus:ring-1 focus:ring-ace-highlight transition-all" placeholder="e.g. 123">
        </div>
      </div>

      <div>
        <label class="block text-xs tracking-widest text-ace-text mb-2">TARGET IDENTIFIER (TITLE)</label>
        <input v-model="form.title" type="text" required class="block w-full ace-input bg-ace-bg/30 p-2 border border-ace-border focus:border-ace-highlight focus:ring-1 focus:ring-ace-highlight transition-all text-white text-lg font-sans">
      </div>

      <div>
        <label class="block text-xs tracking-widest text-ace-text mb-2">INITIAL STATUS</label>
        <select v-model="form.status" class="block w-full bg-ace-bg/80 border border-ace-border text-ace-text focus:border-ace-highlight p-2 rounded-none outline-none">
          <option value="inProgress">IN PROGRESS (ACTIVE)</option>
          <option value="icebox">ICEBOX (HOLD)</option>
        </select>
      </div>

      <div>
        <label class="block text-xs tracking-widest text-ace-text mb-2">INTELLIGENCE DATA (MEMO)</label>
        <textarea v-model="form.content" rows="6" class="block w-full ace-input bg-ace-bg/30 p-3 border border-ace-border focus:border-ace-highlight focus:ring-1 focus:ring-ace-highlight transition-all font-sans text-sm resize-y" placeholder="Markdown is supported..."></textarea>
      </div>

          <div class="pt-6 border-t border-ace-border/30">
            <button type="submit" class="w-full ace-button bg-ace-highlight text-ace-bg font-bold py-3 hover:bg-white transition-colors" :disabled="isSaving">
              {{ isSaving ? 'UPLOADING...' : 'COMMIT TARGET DATA' }}
            </button>
          </div>
          
          <p v-if="successMessage" class="text-ace-highlight mt-4 text-center text-sm font-bold tracking-widest bg-ace-bg/80 py-2 border border-ace-highlight/50">{{ successMessage }}</p>
          <p v-if="errorMessage" class="text-red-400 mt-4 text-center text-sm font-bold tracking-widest bg-red-900/30 py-2 border border-red-500/50">{{ errorMessage }}</p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useProjects } from '~/composables/useProjects'

const { projectsData, loadProjects, resolveProjectId } = useProjects()

onMounted(async () => {
  try {
    await loadProjects()
  } catch (e) {
    console.error('Failed to load projects:', e)
  }
})

const form = ref({
  project: '',
  issue: '',
  title: '',
  status: 'inProgress',
  content: ''
})

const isSaving = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const saveTask = async () => {
  isSaving.value = true
  successMessage.value = ''
  errorMessage.value = ''

  const date = new Date().toISOString()
  const slug = form.value.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `task-${Date.now()}`
  const filename = `${slug}.md`

  try {
    if (window.electronAPI && window.electronAPI.saveMarkdown) {
      const customDir = localStorage.getItem('tasksDir') || undefined
      
      // Resolve project ID and Name using composable
      const inputName = form.value.project || '未分類'
      const matchedId = await resolveProjectId(inputName)

      // Construct Front-matter
      const frontmatter = `---
id: "task-${Date.now()}"
title: "${form.value.title.replace(/"/g, '\\"')}"
project_id: "${matchedId}"
project_name: "${inputName.replace(/"/g, '\\"')}"
issue: ${form.value.issue || null}
status: "${form.value.status}"
created_at: "${date}"
updated_at: "${date}"
---

${form.value.content}
`

      const response = await window.electronAPI.saveMarkdown(filename, frontmatter, customDir)
      if (response.success) {
        successMessage.value = 'Task saved successfully!'
        // Reset form
        form.value.title = ''
        form.value.content = ''
      } else {
        errorMessage.value = `Failed to save: ${response.error}`
      }
    } else {
      errorMessage.value = 'Electron API is not available. Are you running in browser?'
    }
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    isSaving.value = false
  }
}
</script>
