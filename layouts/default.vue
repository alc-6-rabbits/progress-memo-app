<template>
  <div class="h-screen w-screen overflow-hidden text-tcc-text font-mono flex flex-col tech-bg">
    <div class="scanlines"></div>

    <!-- HEADER -->
    <header class="flex-none grid grid-cols-[1fr_3fr_1fr] items-center px-8 py-3 border-b border-tcc-border/20 z-10" style="background: rgba(0, 180, 255, 0.06);">
      <div class="flex items-center">
        <div class="laser-scan-wrapper">
          <img src="~/assets/tcc-logo.png" alt="TCC LOGO" class="h-12 w-auto opacity-90 drop-shadow-[0_0_8px_rgba(0,212,255,0.5)] logo-3d-spin">
        </div>
      </div>
      <h1 class="text-2xl tracking-widest text-tcc-hi drop-shadow-[0_0_8px_rgba(125,211,252,0.8)] flex items-center gap-3 justify-self-center transition-all duration-300">
        <span class="text-tcc-border">[</span>
        <span>{{ pageTitle }}</span>
        <span class="text-tcc-warn">{{ appVersion }}</span>
        <span class="text-tcc-border">]</span>
      </h1>
      <div class="text-right text-xs text-tcc-text/80 tracking-[0.2em] flex flex-col items-end gap-1 justify-self-end leading-tight">
        <p>{{ formattedDate }}</p>
        <p>{{ formattedTime }}</p>
      </div>
    </header>

    <!-- BODY -->
    <div class="flex flex-row flex-grow overflow-hidden z-10 bg-transparent">
      <!-- SIDEBAR -->
      <nav class="w-44 flex-none flex flex-col border-r border-tcc-border/20 pt-6 space-y-1" style="background: rgba(0, 180, 255, 0.03);">
        <NuxtLink to="/" class="nav-link" exact-active-class="active">HOME</NuxtLink>
        <NuxtLink to="/tasks" class="nav-link" active-class="active">TASKS</NuxtLink>
        <NuxtLink to="/report" class="nav-link" active-class="active">REPORTS</NuxtLink>
        <NuxtLink to="/settings" class="nav-link" active-class="active">SETTINGS</NuxtLink>
        <div class="flex-grow"></div>
        <div class="px-3 pb-4">
          <button class="btn btn-primary w-full text-center tracking-widest" @click="createNewTask">+ NEW TASK</button>
        </div>
      </nav>

      <!-- MAIN CONTENT / SLOT -->
      <main class="flex-grow flex overflow-hidden relative">
        <!-- NuxtPage maps here -->
        <slot />
      </main>
    </div>

    <!-- FOOTER -->
    <footer class="flex-none flex items-center justify-between px-8 py-2.5 border-t border-tcc-border/20 text-[10px] tracking-widest text-tcc-text z-10" style="background: rgba(0, 180, 255, 0.06);">
      <div class="flex items-center gap-3">
        <span>SYSTEM: <span class="text-tcc-hi font-bold">ONLINE</span></span>
        <span class="opacity-30">|</span>
        <span>G-SYNC: <span class="text-[#4ade80] font-bold">OK</span></span>
        <span class="opacity-30">|</span>
        <span>CALENDAR: <span class="text-tcc-warn font-bold">READY</span></span>
        <span class="opacity-30">|</span>
        <span>DB: <span class="text-tcc-hi">LOCAL-FS</span></span>
      </div>
      <div class="text-center text-tcc-hi font-bold text-[12px] tracking-[0.2em] drop-shadow-[0_0_5px_rgba(125,211,252,0.5)] flex-grow">
         TACTICAL DATA LINK // CONNECTION STABLE {{ appVersion.replace('v', '') }}
      </div>
      <div class="flex items-center gap-3">
        <span>LMT</span>
        <span class="opacity-30">|</span>
        <span class="opacity-60 font-mono text-[9px]">CPU: 12%</span>
        <span class="opacity-30">|</span>
        <span class="opacity-60 font-mono text-[9px]">MEM: 450MB</span>
        <span class="opacity-30">|</span>
        <span class="opacity-60 font-mono text-[9px] bg-tcc-border/20 px-1 border border-tcc-border/40">NODE V20</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const appVersion = ref('v1.5.0')
const currentTime = ref(new Date())
let timer

onMounted(() => {
  timer = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const formattedDate = computed(() => {
  const options = { month: 'short', day: '2-digit', year: 'numeric' }
  const parts = currentTime.value.toLocaleDateString('en-US', options).toUpperCase().replace(',', '').split(' ')
  return `${parts[0]} ${parts[1]} ${parts[2]}`
})

const formattedTime = computed(() => {
  return currentTime.value.toLocaleTimeString('en-US', { hour12: false })
})

const pageTitle = computed(() => {
  const path = route.path
  if (path === '/') return 'SYSTEM DASHBOARD'
  if (path.startsWith('/tasks')) return 'TASK OPERATIONS'
  if (path.startsWith('/report')) return 'INTELLIGENCE REPORTS'
  if (path.startsWith('/settings')) return 'SYSTEM CONFIGURATION'
  return 'TACTICAL INTERFACE'
})

const createNewTask = () => {
  router.push('/tasks?new=true')
}
</script>

<style>
/* Global CSS for TCC elements applied across pages */
.scanlines { 
  position: fixed; inset: 0; pointer-events: none; z-index: 9999; 
  background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px); 
}
.custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: rgba(30, 90, 138, 0.1); }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #1e5a8a; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #8fd4f8; }

/* bracket-box: ブラケット角 */
.bracket-box { position: relative; border: 1px solid rgba(0,140,210,0.4); }
.bracket-box::before, .bracket-box::after { content: ''; position: absolute; width: 12px; height: 12px; pointer-events: none; z-index: 1; }
.bracket-box::before { top: -1px; left: -1px; border-top: 2px solid #96ecff; border-left: 2px solid #96ecff; box-shadow: -2px -2px 5px rgba(150,236,255,0.4); }
.bracket-box::after  { top: -1px; right: -1px; border-top: 2px solid #96ecff; border-right: 2px solid #96ecff; box-shadow: 2px -2px 5px rgba(150,236,255,0.4); }

.glow-blue { text-shadow: 0 0 8px rgba(150,236,255,0.8); }
.glow-red  { text-shadow: 0 0 8px rgba(239,68,68,0.8); }

.nav-link { 
  display: block; width: 100%; text-align: left; padding: 0.5rem 1rem; 
  color: #a8d8f0; letter-spacing: 0.1em; font-size: 0.875rem; 
  transition: all 0.2s; cursor: pointer; text-decoration: none;
}
.nav-link:hover { color: #96ecff; text-shadow: 0 0 4px rgba(150,236,255,0.5); }
.nav-link.active { 
  background-color: #f5a623; 
  color: #050d1e; 
  font-weight: bold;
  box-shadow: 0 0 12px rgba(245,166,35,0.5);
}
.btn { 
  padding: 0.25rem 0.75rem; font-size: 0.75rem; border: 1px solid; 
  letter-spacing: 0.1em; transition: all 0.2s; cursor: pointer; background: transparent;
}
.btn-primary { 
  border-color: #96ecff; 
  color: #96ecff;
  box-shadow: 0 0 6px rgba(150,236,255,0.2);
}
.btn-primary:hover { 
  background-color: #96ecff; 
  color: #050d1e; 
}
.tag { padding: 0.125rem 0.5rem; font-size: 0.6875rem; border-width: 1px; border-style: solid; white-space: nowrap; }
.badge-todo { border-color:#6b7280; color:#9ca3af; } 
.badge-inprog { border-color:#96ecff; color:#96ecff; } 
.badge-done { border-color:#22c55e; color:#86efac; } 
.badge-icebox { border-color:#8b5cf6; color:#c4b5fd; } 
.badge-high { border-color:#ef4444; color:#fca5a5; } 
.badge-medium { border-color:#d4880a; color:#fbbf24; } 
.badge-low { border-color:#6b7280; color:#9ca3af; }

/* body背景はtech-bgクラスで管理するためここでは色を上書きしない */
body {
  color: #a8d8f0;
}
</style>
