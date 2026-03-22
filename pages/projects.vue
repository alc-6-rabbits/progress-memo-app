<template>
  <div class="h-full w-full glass-panel relative group overflow-hidden flex flex-col items-center p-8">
    <div class="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-ace-highlight m-4 opacity-50"></div>
    <div class="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-ace-highlight m-4 opacity-50"></div>

    <div class="w-full max-w-5xl flex flex-col h-full relative z-10">
      <div class="flex justify-between items-center mb-8 border-b border-white/20 pb-4 shrink-0">
        <h1 class="text-2xl font-mono tracking-widest text-ace-title drop-shadow-title">>> PROJECT MANAGER</h1>
        <NuxtLink to="/" class="text-ace-text hover:text-ace-highlight font-mono tracking-widest text-sm">[ CANCEL & RTB ]</NuxtLink>
      </div>

      <div class="flex-grow overflow-y-auto pr-4 space-y-8 font-mono">
        <div class="border border-ace-border/30 p-6 bg-ace-bg/30">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-bold tracking-widest text-ace-highlight flex items-center">
              <span class="w-2 h-4 bg-ace-highlight mr-2 inline-block"></span>ACTIVE PROJECTS
            </h2>
            <button @click="addProject" class="ace-button text-xxs border-ace-text text-ace-text hover:bg-ace-highlight hover:text-ace-bg">+ ADD NEW PROJECT</button>
          </div>
          
          <div v-if="loading" class="text-center py-4 font-mono text-xs text-ace-highlight animate-pulse tracking-widest">
            LOADING DATALINK...
          </div>
          <div v-else class="space-y-3">
            <div v-for="id in Object.keys(projectsData.project)" :key="id" class="flex items-center space-x-3 bg-black/20 p-2 border border-ace-border/30 group">
              <span class="text-ace-warning font-bold w-12 text-center text-xxs bg-ace-bg border border-ace-warning/50 py-1">ID: {{ id }}</span>
              <div class="flex-grow flex items-center space-x-4">
                <input 
                  v-model="projectsData.project[id].name" 
                  type="text" 
                  class="block flex-grow ace-input bg-transparent py-2 px-3 font-bold text-white text-sm focus:bg-ace-bg/80 focus:border-ace-highlight transition-all"
                  placeholder="PROJECT NAME"
                >
                <!-- Tag UI -->
                <div class="flex items-center space-x-1 flex-wrap shrink-0">
                  <span v-for="tag in (projectsData.project[id].tags || [])" :key="tag"
                        class="px-2 py-0.5 bg-ace-warning/20 border border-ace-warning/50 text-xxs text-ace-warning flex items-center space-x-1">
                    <span>{{ tag }}</span>
                    <button @click="removeTag(id, tag)" class="hover:text-white ml-1">×</button>
                  </span>
                  <input v-model="newTagInput[id]"
                         @keyup.enter="addTag(id)"
                         class="w-24 bg-transparent border-b border-ace-border text-xxs px-1 py-0.5 text-white focus:outline-none focus:border-ace-highlight"
                         placeholder="+ Tag" />
                </div>
              </div>
              <button @click="removeProject(id)" class="text-red-500 hover:text-red-300 p-2 opacity-50 group-hover:opacity-100 transition-opacity" title="DELETE PROJECT">×</button>
            </div>
            <div v-if="Object.keys(projectsData.project).length === 0" class="text-xs text-ace-text py-8 text-center bg-black/20 border border-ace-border/30">
              NO PROJECTS FOUND.
            </div>
          </div>
          <p class="mt-6 text-xs text-ace-text">Changing a project name here will automatically synchronize across all tasks assigned to that project.</p>
        </div>
      </div>

      <div class="pt-6 border-t border-ace-border/30 flex justify-end shrink-0">
        <button @click="saveChanges" class="ace-button ace-button-primary py-3 px-8 text-sm hover:bg-white transition-colors" :disabled="saving">
          {{ saving ? 'UPLOADING...' : 'COMMIT CHANGES >>' }}
        </button>
      </div>
      <p v-if="message" :class="[isError ? 'text-red-400' : 'text-ace-highlight', 'text-right mt-4 text-sm font-bold tracking-widest']">{{ message }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useProjects } from '~/composables/useProjects'

const { projectsData, loadProjects, saveProjects } = useProjects()
const loading = ref(true)
const saving = ref(false)
const message = ref('')
const isError = ref(false)
const newTagInput = ref({})

onMounted(async () => {
    try {
        await loadProjects()
    } catch (e) {
        console.error('Failed to load projects:', e)
        showMessage('Failed to load projects', true)
    } finally {
        loading.value = false
    }
})

const addProject = () => {
    const ids = Object.keys(projectsData.value.project).map(Number).filter(n => !isNaN(n))
    const nextId = ids.length > 0 ? Math.max(...ids) + 1 : 1
    projectsData.value.project[String(nextId)] = { name: `N/A - ${nextId}`, tags: [] }
}

const removeProject = (id) => {
    if (confirm(`Delete project ID ${id}? Tasks associated with this ID may lose their classification.`)) {
        delete projectsData.value.project[id]
    }
}

const addTag = (id) => {
  const tagName = (newTagInput.value[id] || '').trim()
  if (!tagName) return
  if (!projectsData.value.project[id].tags) {
    projectsData.value.project[id].tags = []
  }
  if (!projectsData.value.project[id].tags.includes(tagName)) {
    projectsData.value.project[id].tags.push(tagName)
  }
  newTagInput.value[id] = ''
}

const removeTag = (id, tag) => {
  const tags = projectsData.value.project[id].tags || []
  projectsData.value.project[id].tags = tags.filter(t => t !== tag)
}

const showMessage = (msg, error = false) => {
    message.value = msg
    isError.value = error
    setTimeout(() => message.value = '', 3000)
}

const saveChanges = async () => {
    saving.value = true
    try {
        const response = await saveProjects()
        if (response.success) {
            showMessage('Projects saved successfully!')
        } else {
            showMessage(`Failed to save: ${response.error}`, true)
        }
    } catch (e) {
        console.error(e)
        showMessage('Error saving projects', true)
    } finally {
        saving.value = false
    }
}
</script>
