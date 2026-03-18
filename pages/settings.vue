<template>
  <div class="h-full w-full glass-panel relative group overflow-hidden flex flex-col items-center p-8">
    <div class="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-ace-highlight m-4 opacity-50"></div>
    <div class="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-ace-highlight m-4 opacity-50"></div>

    <div class="w-full max-w-5xl flex flex-col h-full relative z-10">
      <div class="flex justify-between items-center mb-8 border-b border-white/20 pb-4 shrink-0">
        <h1 class="text-2xl font-mono tracking-widest text-ace-title drop-shadow-title">>> SYSTEM CONFIGURATION</h1>
        <NuxtLink to="/" class="text-ace-text hover:text-ace-highlight font-mono tracking-widest text-sm">[ CANCEL & RTB ]</NuxtLink>
      </div>

      <div class="flex-grow overflow-y-auto pr-4 space-y-8 font-mono">
      <div class="border border-ace-border/30 p-6 bg-ace-bg/30">
        <h2 class="text-lg font-bold mb-4 tracking-widest text-ace-highlight flex items-center"><span class="w-2 h-4 bg-ace-highlight mr-2 inline-block"></span>LOCAL STORAGE PATH</h2>
        
        <div class="mb-4">
          <label class="block text-xs font-bold text-ace-text tracking-widest mb-2">TARGET SAVE DIRECTORY (MARKDOWN FILES)</label>
          <div class="flex space-x-2">
            <input 
              v-model="saveDirectory" 
              type="text" 
              class="block w-full ace-input bg-ace-bg/50 p-3 border border-ace-border focus:border-ace-highlight focus:ring-1 focus:ring-ace-highlight transition-all text-white" 
              placeholder="Default: App Internal Directory"
            >
            <button @click="selectDir" class="ace-button ace-button-primary px-6 whitespace-nowrap">BROWSE</button>
          </div>
          <p class="text-xs text-slate-400 mt-2">Example: G:\My Drive\ProgressMemos (Supports Japanese paths)</p>
        </div>
      </div>

      <div class="border border-ace-border/30 p-6 bg-ace-bg/30">
        <h2 class="text-lg font-bold mb-4 tracking-widest text-ace-highlight flex items-center"><span class="w-2 h-4 bg-ace-highlight mr-2 inline-block"></span>COMMUNICATION & DATALINK</h2>
        
        <div class="mb-4">
          <label class="block text-xs font-bold text-ace-text tracking-widest mb-2">GOOGLE CHAT WEBHOOK URL</label>
          <input 
            v-model="webhookUrl" 
            type="password" 
            class="block w-full ace-input bg-ace-bg/50 p-3 border border-ace-border focus:border-ace-highlight focus:ring-1 focus:ring-ace-highlight transition-all" 
            placeholder="https://chat.googleapis.com/v1/spaces/..."
          >
          <p class="text-xs text-slate-400 mt-2">Required for transmitting automated Daily Report payloads.</p>
        </div>

        <div class="mb-4 border-t border-ace-border/30 pt-4">
          <label class="block text-xs font-bold text-ace-text tracking-widest mb-2">GITHUB PERSONAL ACCESS TOKEN (PAT)</label>
          <input 
            v-model="githubPat" 
            type="password" 
            class="block w-full ace-input bg-ace-bg/50 p-3 border border-ace-border focus:border-ace-highlight focus:ring-1 focus:ring-ace-highlight transition-all" 
            placeholder="ghp_xxxxxxxxxxxx"
          >
          <p class="text-xs text-slate-400 mt-2">Required for fetching issues from private repositories.</p>
        </div>

        <div class="mb-4">
          <label class="block text-xs font-bold text-ace-text tracking-widest mb-2">DEFAULT GITHUB REPOSITORY</label>
          <input 
            v-model="githubRepo" 
            type="text" 
            class="block w-full ace-input bg-ace-bg/50 p-3 border border-ace-border focus:border-ace-highlight focus:ring-1 focus:ring-ace-highlight transition-all text-white" 
            placeholder="owner/repo"
          >
        </div>
      </div>

      <div class="border border-ace-border/30 p-6 bg-ace-bg/30">
        <h2 class="text-lg font-bold mb-4 tracking-widest text-ace-highlight flex items-center"><span class="w-2 h-4 bg-ace-highlight mr-2 inline-block"></span>INTERFACE & STARTUP</h2>
        
        <div class="mb-4">
          <label class="block text-xs font-bold text-ace-text tracking-widest mb-2">UI THEME SELECTION</label>
          <select v-model="uiTheme" class="block w-full bg-ace-bg/80 border border-ace-border text-ace-highlight p-3 rounded-none outline-none font-mono text-sm leading-relaxed">
            <option value="default">DEFAULT STANDARD</option>
            <option value="light">LIGHT MODE (WHITE BASE)</option>
            <option value="dark">DARK MODE (BLACK BASE)</option>
          </select>
        </div>

        <div class="mb-4">
          <label class="block text-xs font-bold text-ace-text tracking-widest mb-2">FONT SIZE (PX)</label>
          <div class="flex items-center space-x-4">
            <input 
              v-model.number="aceFontSize" 
              type="number" 
              min="12" 
              max="32" 
              class="block w-24 ace-input bg-ace-bg/50 p-3 border border-ace-border focus:border-ace-highlight focus:ring-1 focus:ring-ace-highlight transition-all text-white text-center"
            >
            <button @click="resetFontSize" class="ace-button ace-button-primary px-4 py-2">RESET</button>
          </div>
          <p class="text-xs text-slate-400 mt-2">Adjust system-wide base font size (Range: 12px - 32px).</p>
        </div>

        <div class="mb-4 mt-6 pt-4 border-t border-ace-border/30">
          <label class="block text-xs font-bold text-ace-text tracking-widest mb-2">DEFAULT STARTUP SCREEN</label>
          <select v-model="startupScreen" class="block w-full bg-ace-bg/80 border border-ace-border text-ace-highlight p-3 rounded-none outline-none font-mono text-sm leading-relaxed">
            <option value="tasks">TASKS DISPLAY ( / )</option>
            <option value="report">REPORT DISPLAY ( /report )</option>
          </select>
        </div>
      </div>

      <div class="pt-6 border-t border-ace-border/30 flex justify-end">
        <button @click="saveSettings" class="ace-button ace-button-primary py-3 px-8 text-sm hover:bg-white transition-colors">
          CONFIRM CONFIGURATION >>
        </button>
      </div>
      
        <p v-if="saveMessage" class="text-ace-highlight text-right mt-4 text-sm font-bold tracking-widest">{{ saveMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const webhookUrl = ref('')
const githubPat = ref('')
const githubRepo = ref('')
const uiTheme = ref('default')
const startupScreen = ref('tasks')
const aceFontSize = ref(16)
const saveDirectory = ref('')
const saveMessage = ref('')
const isInitializing = ref(true)

onMounted(async () => {
  console.log('[Settings] Component mounted, loading settings...')
  isInitializing.value = true
  const savedWebhook = localStorage.getItem('googleChatWebhook') || ''
  const savedPat = localStorage.getItem('githubPat') || ''
  
  if (window.electronAPI && window.electronAPI.decryptString) {
    console.log('[Settings] Found decryptString API, decrypting...')
    webhookUrl.value = await window.electronAPI.decryptString(savedWebhook)
    githubPat.value = await window.electronAPI.decryptString(savedPat)
  } else {
    console.warn('[Settings] decryptString API not found or safeStorage not available.')
    webhookUrl.value = savedWebhook
    githubPat.value = savedPat
  }

  githubRepo.value = localStorage.getItem('githubRepo') || ''
  uiTheme.value = localStorage.getItem('uiTheme') || 'default'
  startupScreen.value = localStorage.getItem('startupScreen') || 'tasks'
  aceFontSize.value = parseInt(localStorage.getItem('aceFontSize') || '16', 10)
  saveDirectory.value = localStorage.getItem('tasksDir') || ''
  
  isInitializing.value = false
  console.log('[Settings] Initialization complete.')
})

const selectDir = async () => {
    try {
        if (window.electronAPI && window.electronAPI.selectDirectory) {
            const dir = await window.electronAPI.selectDirectory()
            if (dir) {
                saveDirectory.value = dir
            }
        } else {
            alert('Electron API not available.')
        }
    } catch (e) {
        console.error('Failed to select directory:', e)
    }
}

const resetFontSize = () => {
    aceFontSize.value = 16
}

const saveSettings = async () => {
  let finalWebhook = webhookUrl.value
  let finalPat = githubPat.value

  if (window.electronAPI && window.electronAPI.encryptString) {
    finalWebhook = await window.electronAPI.encryptString(webhookUrl.value)
    finalPat = await window.electronAPI.encryptString(githubPat.value)
  }

  localStorage.setItem('googleChatWebhook', finalWebhook)
  localStorage.setItem('githubPat', finalPat)
  localStorage.setItem('githubRepo', githubRepo.value)
  localStorage.setItem('uiTheme', uiTheme.value)
  localStorage.setItem('startupScreen', startupScreen.value)
  localStorage.setItem('tasksDir', saveDirectory.value)
  localStorage.setItem('aceFontSize', aceFontSize.value.toString())
  
  document.documentElement.setAttribute('data-theme', uiTheme.value)
  document.documentElement.style.setProperty('--ace-base-font-size', aceFontSize.value + 'px')
  
  saveMessage.value = 'Settings saved locally!'
  setTimeout(() => saveMessage.value = '', 3000)
}
</script>
