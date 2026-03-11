<template>
  <div class="h-full w-full glass-panel relative group overflow-hidden flex flex-col items-center p-8">
    <div class="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-ace-highlight m-4 opacity-50"></div>
    <div class="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-ace-highlight m-4 opacity-50"></div>

    <div class="w-full max-w-5xl flex flex-col h-full relative z-10">
      <div class="flex justify-between items-center mb-8 border-b border-white/20 pb-4 shrink-0">
        <h1 class="text-2xl font-mono tracking-widest text-ace-title drop-shadow-title">>> GITHUB DATALINK: IMPORT</h1>
        <NuxtLink to="/" class="text-ace-text hover:text-ace-highlight font-mono tracking-widest text-sm">[ RTB TO DATALINK ]</NuxtLink>
      </div>

      <div class="flex-grow flex flex-col overflow-hidden font-mono">
        <!-- Search Header (Two Step: Owner then Repo) -->
        <div class="border border-ace-border/30 p-6 bg-ace-bg/30 mb-6 shrink-0">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Step 1: Search Owner -->
            <div>
              <label class="block text-xs font-bold text-ace-text tracking-widest mb-2">1. SCAN AUTHORIZED REPOS (or filter by Owner)</label>
              <div class="flex space-x-2">
                <input 
                  v-model="ownerName" 
                  type="text" 
                  class="flex-grow ace-input bg-ace-bg/50 p-3 border border-ace-border focus:border-ace-highlight focus:ring-1 focus:ring-ace-highlight transition-all text-white" 
                  placeholder="Optional Owner name"
                  @keyup.enter="fetchRepos"
                >
                <button @click="fetchRepos" :disabled="loadingRepos" class="ace-button ace-button-primary px-4 py-3 whitespace-nowrap">
                  {{ loadingRepos ? 'SCANNING...' : 'SYNC DATALINK' }}
                </button>
              </div>
            </div>

            <!-- Step 2: Select Repository -->
            <div>
              <label class="block text-xs font-bold text-ace-text tracking-widest mb-2">2. SELECT REPO (or Manual: owner/repo)</label>
              <div class="flex space-x-2 relative">
                <div class="flex-grow relative">
                  <select 
                    v-model="repoPath" 
                    class="w-full bg-ace-bg/80 border border-ace-border text-ace-highlight p-3 rounded-none outline-none font-mono text-sm leading-relaxed appearance-none disabled:opacity-50"
                    :disabled="repos.length === 0"
                  >
                    <option value="" disabled>{{ repos.length > 0 ? '-- SELECT REPO --' : 'SYNC FIRST OR TYPE MANUALLY' }}</option>
                    <option v-for="repo in repos" :key="repo.id" :value="repo.full_name">{{ repo.name }}{{ repo.private ? ' (PRIVATE)' : '' }}</option>
                  </select>
                  <div class="mt-2 flex items-center space-x-2">
                    <input 
                      v-model="repoPath" 
                      type="text" 
                      class="flex-grow bg-transparent border-b border-ace-border px-2 py-1 text-[10px] text-white focus:outline-none focus:border-ace-highlight"
                      placeholder="Manual entry if not in list: owner/repo"
                    >
                  </div>
                </div>
                <button @click="fetchIssues" :disabled="loadingIssues || !repoPath" class="ace-button ace-button-primary px-4 py-3 h-[46px] whitespace-nowrap">
                  {{ loadingIssues ? 'SCANNING...' : 'SCAN ISSUES' }}
                </button>
              </div>
            </div>
          </div>
          
          <p v-if="!githubPat" class="text-xs text-red-400 mt-4 font-bold animate-pulse">WARNING: GITHUB PAT NOT DETECTED. PRIVATE REPOS MAY BE INACCESSIBLE. CHECK SETTINGS.</p>
        </div>

        <!-- Issues List -->
        <div class="flex-grow border border-ace-border/30 bg-black/20 overflow-hidden flex flex-col">
          <div class="flex justify-between items-center p-3 border-b border-ace-border/30 bg-ace-bg/50">
            <h2 class="text-xs font-bold tracking-widest text-ace-title drop-shadow-title">>> DETECTED SIGNALS: {{ issues.length }}</h2>
            <div class="flex space-x-4">
              <button v-if="selectedCount > 0" @click="importSelected" :disabled="importing" class="text-[10px] text-white bg-ace-highlight px-3 py-1 hover:brightness-110">
                {{ importing ? 'IMPORTING...' : `IMPORT SELECTED (${selectedCount})` }}
              </button>
            </div>
          </div>
          
          <div class="flex-grow overflow-y-auto">
            <div v-if="loadingIssues" class="h-full flex items-center justify-center opacity-50 animate-pulse">
              <p class="tracking-[0.5em] text-ace-highlight">INITIALIZING SCAN...</p>
            </div>
            <div v-else-if="issues.length === 0" class="h-full flex items-center justify-center opacity-30">
              <p class="tracking-widest">NO ISSUES FOUND OR REPOSITORY OFFLINE.</p>
            </div>
            <table v-else class="w-full text-left text-[11px] border-collapse">
              <thead class="sticky top-0 bg-ace-bg/90 backdrop-blur-sm z-10 border-b border-ace-border/50 text-ace-text">
                <tr>
                  <th class="p-3 w-10 text-center"><input type="checkbox" @change="toggleAll" :checked="isAllSelected"></th>
                  <th class="p-3 w-16">#ID</th>
                  <th class="p-3">TITLE / IDENTIFIER</th>
                  <th class="p-3 w-32">AUTHOR</th>
                  <th class="p-3 w-32">UPDATED</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-ace-border/10">
                <tr v-for="issue in issues" :key="issue.id" class="hover:bg-ace-highlight/5 group cursor-pointer" @click="toggleIssue(issue.id)">
                  <td class="p-3 text-center" @click.stop><input type="checkbox" v-model="selectedIssueIds" :value="issue.id"></td>
                  <td class="p-3 text-ace-highlight font-bold">{{ issue.number }}</td>
                  <td class="p-3">
                    <div class="text-white font-bold mb-1">{{ issue.title }}</div>
                    <div class="flex space-x-2">
                       <span v-for="label in issue.labels" :key="label.name" class="px-1 border text-[9px]" :style="{ color: '#' + label.color, borderColor: '#' + label.color }">
                         {{ label.name }}
                       </span>
                    </div>
                  </td>
                  <td class="p-3 text-ace-text">{{ issue.user.login }}</td>
                  <td class="p-3 text-ace-text">{{ new Date(issue.updated_at).toLocaleDateString() }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Toast/Notification -->
    <div v-if="message" class="fixed bottom-8 right-8 glass-panel border border-ace-highlight p-4 z-50 animate-bounce">
       <p class="text-xs font-bold text-ace-highlight tracking-widest">{{ message }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const existingTasks = ref([])
const ownerName = ref('')
const repos = ref([])
const repoPath = ref('')
const githubPat = ref('')
const issues = ref([])
const loadingRepos = ref(false)
const loadingIssues = ref(false)
const importing = ref(false)
const selectedIssueIds = ref([])
const message = ref('')

onMounted(async () => {
  console.log('[GitHubImport] Component mounted, loading settings...')
  const savedPat = localStorage.getItem('githubPat') || ''
  if (window.electronAPI && window.electronAPI.decryptString) {
    console.log('[GitHubImport] Decrypting GitHub PAT...')
    githubPat.value = await window.electronAPI.decryptString(savedPat)
  } else {
    githubPat.value = savedPat
  }

  const savedRepo = localStorage.getItem('githubRepo') || ''
  if (savedRepo) {
    ownerName.value = savedRepo.split('/')[0]
    repoPath.value = savedRepo
    fetchRepos()
  }
  refreshExistingTasks()
  console.log('[GitHubImport] Initialization complete.')
})

const refreshExistingTasks = async () => {
  if (window.electronAPI && window.electronAPI.getAllMarkdowns) {
    const customDir = localStorage.getItem('tasksDir') || undefined
    existingTasks.value = await window.electronAPI.getAllMarkdowns(customDir)
  }
}

// Auto scan issues when repo is selected from dropdown
watch(repoPath, (newVal) => {
  if (newVal) {
    fetchIssues()
  }
})

const getGitHubHeaders = () => {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
  }
  if (githubPat.value) {
    headers['Authorization'] = `token ${githubPat.value}`
  }
  return headers
}

const fetchRepos = async () => {
  // Guard: Don't scan if we have neither a PAT nor an Owner name
  if (!githubPat.value && !ownerName.value) return
  
  loadingRepos.value = true
  repos.value = []
  
  try {
    let url = 'https://api.github.com/user/repos?sort=updated&per_page=100'
    
    // If no PAT, we must use the public listing endpoint for a specific owner
    if (!githubPat.value && ownerName.value) {
      url = `https://api.github.com/users/${ownerName.value}/repos?sort=updated&per_page=100`
    }
    
    let response = await fetch(url, {
      headers: getGitHubHeaders()
    })
    
    // Fallback logic for when /user/repos is not available or empty (e.g. Fine-grained token scope issues)
    if (!response.ok && ownerName.value) {
      console.log(`[GitHub API] /user/repos failed (${response.status}), trying public user/org fallback for: ${ownerName.value}`)
      
      // Try User endpoint
      url = `https://api.github.com/users/${ownerName.value}/repos?sort=updated&per_page=100`
      response = await fetch(url, { headers: getGitHubHeaders() })
      
      // If User fails, try Org endpoint
      if (response.status === 404) {
        url = `https://api.github.com/orgs/${ownerName.value}/repos?sort=updated&per_page=100`
        response = await fetch(url, { headers: getGitHubHeaders() })
      }
    }
    
    if (!response.ok) {
       const errorText = await response.text().catch(() => response.statusText)
       throw new Error(`GitHub API Error: ${response.status} at ${url}\nDetails: ${errorText}`)
    }
    
    const data = await response.json()
    
    if (ownerName.value) {
      repos.value = data.filter(r => r.owner.login.toLowerCase() === ownerName.value.toLowerCase())
      // If no match by owner, but we got data, show all (maybe token sees something else)
      if (repos.value.length === 0 && data.length > 0) {
        repos.value = data 
      }
    } else {
      repos.value = data
    }
    
    if (repos.value.length === 0) {
      showToast("REPOS NOT DETECTED. CHECK TOKEN SCOPE OR OWNER NAME.")
    }
  } catch (err) {
    console.error(err)
    alert('GITHUB ERROR:\n' + err.message)
  } finally {
    loadingRepos.value = false
  }
}

const fetchIssues = async () => {
  // Guard: Must have owner/repo format
  if (!repoPath.value || !repoPath.value.includes('/')) return
  
  loadingIssues.value = true
  issues.value = []
  selectedIssueIds.value = []
  
  const url = `https://api.github.com/repos/${repoPath.value}/issues?state=open&sort=updated&per_page=100`
  
  try {
    const response = await fetch(url, {
      headers: getGitHubHeaders()
    })
    
    if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        throw new Error(`GitHub API Error: ${response.status} at ${url}\nDetails: ${errorText}`)
    }
    
    const data = await response.json()
    issues.value = data.filter(i => !i.pull_request)
  } catch (err) {
    console.error(err)
    alert('ISSUE SCAN ERROR:\n' + err.message)
  } finally {
    loadingIssues.value = false
  }
}

const toggleIssue = (id) => {
  const index = selectedIssueIds.value.indexOf(id)
  if (index > -1) {
    selectedIssueIds.value.splice(index, 1)
  } else {
    selectedIssueIds.value.push(id)
  }
}

const toggleAll = (e) => {
  if (e.target.checked) {
    selectedIssueIds.value = issues.value.map(i => i.id)
  } else {
    selectedIssueIds.value = []
  }
}

const isAllSelected = computed(() => {
  return issues.value.length > 0 && selectedIssueIds.value.length === issues.value.length
})

const selectedCount = computed(() => selectedIssueIds.value.length)

const importSelected = async () => {
  if (selectedIssueIds.value.length === 0) return
  importing.value = true
  
  const selectedIssues = issues.value.filter(i => selectedIssueIds.value.includes(i.id))
  let successCount = 0
  let skipCount = 0
  
  try {
    for (const issue of selectedIssues) {
      const targetId = `github-${issue.id}`
      const existing = existingTasks.value.find(t => t.id === targetId)
      
      let filename = `task-${Date.now()}-${issue.number}.md`
      let finalStatus = 'inProgress'

      if (existing) {
        const overwrite = confirm(`Issue #${issue.number}「${issue.title}」は既に取り込まれています。\n上書きしますか？（キャンセルするとスキップします）`)
        if (!overwrite) {
          skipCount++
          continue
        }
        // Use existing filename and preserve its status
        filename = existing._file
        finalStatus = existing.status || 'inProgress'
      }

      // 1. Fetch comments
      const commentsResponse = await fetch(issue.comments_url, { headers: getGitHubHeaders() })
      const comments = await commentsResponse.json()
      
      // 2. Prepare Task Markdown
      const createdAt = new Date(issue.created_at).toISOString()
      const updatedAt = new Date(issue.updated_at).toISOString()
      
      // Build Body
      let body = `## [${new Date(issue.created_at).toLocaleDateString()}]\n${issue.body || 'No description provided.'}\n\n`
      
      if (comments && Array.isArray(comments) && comments.length > 0) {
        for (const comment of comments) {
          body += `## [${new Date(comment.created_at).toLocaleDateString()}]\n${comment.body}\n\n`
        }
      }
      
      const repoNameOnly = repoPath.value.split('/').pop()
      const frontmatter = `---
id: "${targetId}"
title: "${issue.title.replace(/"/g, '\\"')}"
project: "${repoNameOnly.replace(/"/g, '\\"')}"
issue: ${issue.number}
issue_url: "${issue.html_url}"
status: "${finalStatus}"
created_at: "${createdAt}"
updated_at: "${updatedAt}"
---

${body}`

      // 3. Save via Electron API
      if (window.electronAPI && window.electronAPI.saveMarkdown) {
        const customDir = localStorage.getItem('tasksDir') || undefined
        const res = await window.electronAPI.saveMarkdown(filename, frontmatter, customDir)
        if (res.success) {
          successCount++
        }
      }
    }
    
    let resultMsg = `SUCCESSFULLY IMPORTED ${successCount} DATALINK TARGETS.`
    if (skipCount > 0) resultMsg += ` (${skipCount} SKIPPED)`
    showToast(resultMsg)
    
    // Refresh local state
    await refreshExistingTasks()
    
    // Remove imported issues from list
    issues.value = issues.value.filter(i => !selectedIssueIds.value.includes(i.id))
    selectedIssueIds.value = []
    
  } catch (err) {
    console.error(err)
    alert('Import failed in mid-operation: ' + err.message)
  } finally {
    importing.value = false
  }
}

const showToast = (msg) => {
  message.value = msg
  setTimeout(() => message.value = '', 5000)
}
</script>

<style scoped>
.ace-input {
  border-radius: 0;
  outline: none;
}
</style>
