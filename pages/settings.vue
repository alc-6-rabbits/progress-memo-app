<template>
  <div class="h-full w-full flex flex-row overflow-hidden relative font-mono text-tcc-text">
    
    <main class="flex-grow flex flex-col p-8 overflow-y-auto custom-scrollbar relative">
      <div class="max-w-4xl w-full mx-auto">
        
        <div class="flex justify-between items-center border-b border-tcc-border/40 pb-4 mb-8">
          <div>
            <h1 class="text-2xl text-tcc-hi font-bold glow-blue tracking-wider">SYSTEM SETTINGS</h1>
            <p class="text-[10px] text-tcc-text opacity-50 mt-1 uppercase tracking-widest">TCC Global Configuration Parameters</p>
          </div>
          <div class="flex flex-col items-end">
             <button @click="saveSettings" class="btn btn-primary px-8 py-2 font-bold transition-all" :class="{'animate-pulse': isSaving}">
               {{ isSaving ? 'APPLYING...' : '[ APPLY PARAMETERS ]' }}
             </button>
             <span v-if="saveMessage" class="text-tcc-hi text-[10px] tracking-widest mt-2">{{ saveMessage }}</span>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <!-- Left Column: Core System -->
          <div class="space-y-6">
            <section class="border border-tcc-border/20 bg-tcc-panel/15 backdrop-blur-sm p-6 space-y-4">
              <h2 class="text-sm font-bold text-tcc-hi border-b border-tcc-border/30 pb-2 mb-4">■ 01: OPERATIONAL ENVIRONMENT</h2>
              
              <div>
                <label class="block text-[10px] uppercase font-bold text-tcc-text opacity-70 mb-1 tracking-widest">Database Root Path (Workspaces)</label>
                <div class="flex gap-2">
                  <input type="text" v-model="saveDirectory" class="bg-black/50 border border-tcc-border/40 text-tcc-hi px-3 py-1.5 w-full outline-none flex-grow opacity-80" readonly placeholder="Default App Internal Directory">
                  <button @click="selectDir" class="btn border-tcc-border hover:bg-tcc-hi/20 transition-colors">BROWSE</button>
                </div>
                <p class="text-[10px] opacity-50 mt-1 italic">Target Save Directory for Markdown Data</p>
              </div>

              <div class="flex gap-4">
                <div class="flex-1">
                  <label class="block text-[10px] uppercase font-bold text-tcc-text opacity-70 mb-1 tracking-widest">Terminal Font Size</label>
                  <div class="flex items-center gap-3">
                    <input type="range" v-model.number="aceFontSize" min="10" max="24" class="w-full accent-tcc-hi cursor-pointer">
                    <span class="text-tcc-hi font-bold">{{ aceFontSize }}px</span>
                  </div>
                </div>
                <!-- UI Theme Placeholder - Currently hardcoded to TCC theme -->
                <div class="flex-1 opacity-50 pointer-events-none">
                  <label class="block text-[10px] uppercase font-bold text-tcc-text mb-1 tracking-widest">UI Theme Overlay</label>
                  <select class="bg-black/50 border border-tcc-border/40 text-tcc-hi px-3 py-1.5 w-full outline-none">
                    <option selected>Deep Sea Blue (TCC)</option>
                  </select>
                </div>
              </div>
              
              <div class="pt-4 mt-2 border-t border-tcc-border/20 flex items-center justify-between">
                <label class="text-[11px] uppercase tracking-widest opacity-80">Enable Sound Effects</label>
                <div class="w-10 h-5 bg-tcc-hi/20 rounded-full relative cursor-not-allowed border border-tcc-hi/50 opacity-50" title="Not available in this version">
                  <div class="w-4 h-4 bg-tcc-hi rounded-full absolute right-0.5 top-px"></div>
                </div>
              </div>

              <div class="pt-4 mt-2 border-t border-tcc-border/20">
                <label class="block text-[10px] uppercase font-bold text-tcc-text opacity-70 mb-1 tracking-widest">DEFAULT STARTUP SCREEN</label>
                <select v-model="startupScreen" class="bg-black/50 border border-tcc-border/40 text-tcc-hi px-3 py-1.5 w-full outline-none focus:border-tcc-hi cursor-pointer">
                  <option value="tasks">HOME DASHBOARD ( / )</option>
                  <option value="tasks-editor">TASKS EDITOR ( /tasks )</option>
                  <option value="report">REPORT CENTER ( /report )</option>
                </select>
              </div>

            </section>
          </div>

          <!-- Right Column: API & Sync -->
          <div class="space-y-6 flex flex-col">
            <section class="border border-tcc-border/20 bg-tcc-panel/15 backdrop-blur-sm p-6 space-y-4 flex-1">
              <h2 class="text-sm font-bold text-tcc-hi border-b border-tcc-border/30 pb-2 mb-4">■ 02: EXTERNAL DATALINK</h2>

              <div class="mb-5 border border-tcc-border/20 p-3 bg-black/30 backdrop-blur-sm">
                <div class="flex justify-between items-center mb-2">
                  <label class="block text-[10px] uppercase font-bold text-white opacity-90 mb-0 tracking-widest">GitHub API Token (PAT)</label>
                  <span v-if="isValidatingUser" class="text-[9px] text-tcc-warn font-bold tracking-widest px-2 py-0 border border-tcc-warn bg-tcc-warn/10 animate-pulse">VALIDATING...</span>
                  <span v-else-if="connectedUser" class="text-[9px] text-green-400 font-bold tracking-widest px-2 py-0 border border-green-500/50 bg-green-500/10">CONNECTED</span>
                  <span v-else-if="githubPat" class="text-[9px] text-red-500 font-bold tracking-widest px-2 py-0 border border-red-500 bg-red-500/10">INVALID TOKEN</span>
                  <span v-else class="text-[9px] text-gray-500 font-bold tracking-widest px-2 py-0 border border-gray-500 bg-gray-500/10">OFFLINE</span>
                </div>
                <input type="password" v-model="githubPat" placeholder="ghp_..." class="bg-black/50 border border-tcc-border/40 text-tcc-hi px-3 py-1.5 w-full outline-none focus:border-tcc-hi mb-2 text-xs">
                
                <div class="flex justify-between items-center mb-4 border-b border-tcc-border/20 pb-4">
                  <span class="text-[10px] text-tcc-text opacity-50 italic">
                     <span v-if="connectedUser">Logged in as <strong class="text-tcc-hi">{{ connectedUser.login }}</strong></span>
                     <span v-else>Required for fetching API Activity & Issues</span>
                  </span>
                  <button @click="checkGitHubUser" class="btn border border-tcc-border/50 text-[10px] py-1 px-3 hover:text-white hover:border-white transition-colors">VERIFY LINK</button>
                </div>

                <div class="flex flex-col gap-1 mb-3">
                  <label class="block text-[10px] uppercase font-bold text-white opacity-90 mb-0 tracking-widest">Default GitHub Repository</label>
                  <input type="text" v-model="githubRepo" placeholder="owner/repo" class="bg-black/50 border border-tcc-border/40 text-tcc-hi px-3 py-1.5 w-full outline-none focus:border-tcc-hi text-xs opacity-90">
                  <span class="text-[9px] text-tcc-text opacity-50 italic">Target repository when Issue URLs are omitted</span>
                </div>

                <div class="flex items-center gap-3 pt-3 border-t border-tcc-border/20">
                   <label class="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" v-model="autoCommentOnIssue" class="sr-only peer">
                     <div class="w-9 h-5 bg-black border border-tcc-border/50 rounded-full peer 
                                 peer-checked:bg-tcc-hi/30 peer-checked:border-tcc-hi
                                 after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                                 after:bg-tcc-text after:border-tcc-border/50 after:border after:rounded-full after:h-4 after:w-4 after:transition-all
                                 peer-checked:after:translate-x-full peer-checked:after:bg-tcc-hi">
                     </div>
                   </label>
                   <span class="text-[10px] tracking-widest uppercase" :class="autoCommentOnIssue ? 'text-tcc-hi font-bold' : 'opacity-70'">Auto-Comment on GitHub Issues</span>
                </div>
              </div>

              <div class="border border-tcc-border/20 p-3 bg-black/30 backdrop-blur-sm">
                <div class="flex justify-between items-center mb-2">
                  <label class="block text-[10px] uppercase font-bold text-white opacity-90 mb-0 tracking-widest">Google Chat Webhook</label>
                  <span :class="webhookUrl ? 'text-green-400 border-green-500/50 bg-green-500/10' : 'text-gray-500 border-gray-500 bg-gray-500/10'" class="text-[9px] font-bold tracking-widest px-2 py-0 border">
                     {{ webhookUrl ? 'CONFIGURED' : 'OFFLINE' }}
                  </span>
                </div>
                <input type="password" v-model="webhookUrl" placeholder="https://chat.googleapis.com/v1/spaces/..." class="bg-black/50 border border-tcc-border/40 text-tcc-hi px-3 py-1.5 w-full outline-none focus:border-tcc-hi mb-2 text-xs">
                <div class="text-[10px] text-tcc-text opacity-50 italic">Output target for Report Transmissions</div>
              </div>
              
            </section>
          </div>

        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useGitHubREST } from '~/composables/useGitHubREST'

const { getAuthenticatedUser } = useGitHubREST()

const connectedUser = ref(null)
const isValidatingUser = ref(false)

const webhookUrl = ref('')
const githubPat = ref('')
const githubRepo = ref('')
const autoCommentOnIssue = ref(false)
const startupScreen = ref('tasks')
const aceFontSize = ref(14)
const saveDirectory = ref('')

const isSaving = ref(false)
const saveMessage = ref('')
const isInitializing = ref(true)

onMounted(async () => {
  isInitializing.value = true
  const savedWebhook = localStorage.getItem('googleChatWebhook') || ''
  const savedPat = localStorage.getItem('githubPat') || ''
  
  if (window.electronAPI && window.electronAPI.decryptString) {
    webhookUrl.value = await window.electronAPI.decryptString(savedWebhook)
    githubPat.value = await window.electronAPI.decryptString(savedPat)
  } else {
    webhookUrl.value = savedWebhook
    githubPat.value = savedPat
  }

  githubRepo.value = localStorage.getItem('githubRepo') || ''
  autoCommentOnIssue.value = localStorage.getItem('autoCommentOnIssue') === 'true'
  startupScreen.value = localStorage.getItem('startupScreen') || 'tasks'
  aceFontSize.value = parseInt(localStorage.getItem('aceFontSize') || '14', 10)
  saveDirectory.value = localStorage.getItem('tasksDir') || ''
  
  isInitializing.value = false
  
  if (githubPat.value) {
    await checkGitHubUser()
  }
})

const checkGitHubUser = async () => {
  if (!githubPat.value) {
    connectedUser.value = null
    return
  }
  
  isValidatingUser.value = true
  const res = await getAuthenticatedUser()
  isValidatingUser.value = false
  
  if (res.success) {
    connectedUser.value = res
  } else {
    connectedUser.value = null
    console.error('[Settings] GitHub user check failed:', res.error)
  }
}

const selectDir = async () => {
    try {
        if (window.electronAPI && window.electronAPI.selectDirectory) {
            const dir = await window.electronAPI.selectDirectory()
            if (dir) {
                saveDirectory.value = dir
            }
        }
    } catch (e) {
        console.error('Failed to select directory:', e)
    }
}

const saveSettings = async () => {
  isSaving.value = true
  
  let finalWebhook = webhookUrl.value
  let finalPat = githubPat.value

  if (window.electronAPI && window.electronAPI.encryptString) {
    finalWebhook = await window.electronAPI.encryptString(webhookUrl.value)
    finalPat = await window.electronAPI.encryptString(githubPat.value)
  }

  localStorage.setItem('googleChatWebhook', finalWebhook)
  localStorage.setItem('githubPat', finalPat)
  localStorage.setItem('githubRepo', githubRepo.value)
  localStorage.setItem('autoCommentOnIssue', autoCommentOnIssue.value.toString())
  localStorage.setItem('startupScreen', startupScreen.value)
  localStorage.setItem('tasksDir', saveDirectory.value)
  localStorage.setItem('aceFontSize', aceFontSize.value.toString())
  
  // Re-validate user after saving new PAT
  await checkGitHubUser()
  
  document.documentElement.style.setProperty('--ace-base-font-size', aceFontSize.value + 'px')
  
  isSaving.value = false
  saveMessage.value = 'DATA SYNC COMPLETE.'
  setTimeout(() => saveMessage.value = '', 3000)
}
</script>

<style scoped>
.btn {
  @apply px-4 py-1.5 text-[11px] tracking-widest transition-all;
}
.btn-primary {
  @apply border border-tcc-hi text-tcc-hi bg-tcc-hi/10 hover:bg-tcc-hi hover:text-black;
}
/* Ensure range thumb styling for webkit */
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  border: 1px solid #bae6fd;
  height: 16px;
  width: 8px;
  border-radius: 0;
  background: #bae6fd;
  cursor: pointer;
  margin-top: -6px; /* You need to specify a margin in Chrome, but in Firefox and IE it is automatic */
}
input[type=range]::-webkit-slider-runnable-track {
  width: 100%;
  height: 4px;
  cursor: pointer;
  background: rgba(42, 106, 154, 0.4);
}
</style>
