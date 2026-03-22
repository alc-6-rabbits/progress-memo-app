<template>
  <div class="h-screen w-screen ace-bg text-ace-text relative font-sans flex flex-col overflow-hidden">
    <div class="scanlines-overlay"></div>
    
    <div class="relative z-10 flex flex-col h-full w-full">
      <!-- Fixed Header -->
      <header class="flex-none border-b border-ace-border bg-ace-panel bg-opacity-70 shadow-[0_0_15px_rgba(52,126,177,0.3)]">
        <div class="w-full px-6 py-4 flex justify-between items-center">
          <NuxtLink to="/" class="text-2xl font-mono font-bold text-ace-highlight tracking-widest flex items-center space-x-2 animate-hologram">
            <span class="inline-block w-2 h-6 bg-ace-highlight"></span>
            <span>SYSTEM.MENU</span>
          </NuxtLink>
          <nav class="space-x-6 font-mono text-sm tracking-widest">
            <NuxtLink to="/briefing" class="hover:text-ace-highlight transition-colors">>> BRIEFING</NuxtLink>
            <NuxtLink to="/" class="hover:text-ace-highlight transition-colors">>> TASKS</NuxtLink>
            <NuxtLink to="/report" class="hover:text-ace-highlight transition-colors">>> REPORT</NuxtLink>
            <NuxtLink to="/projects" class="hover:text-ace-highlight transition-colors">>> PROJECTS</NuxtLink>
            <NuxtLink to="/settings" class="hover:text-ace-highlight transition-colors">>> CONFIG</NuxtLink>
            <NuxtLink to="/new" class="ace-button ace-button-primary hover:text-ace-bg ml-4">INITIALIZE TASK</NuxtLink>
          </nav>
        </div>
      </header>

      <!-- Scrollable Main Content -->
      <main class="flex-grow w-full px-6 py-6 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
