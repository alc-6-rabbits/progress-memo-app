import { ref, computed } from 'vue'

export const useProjects = () => {
  const projectsData = ref({ project: {} })

  const loadProjects = async () => {
    if (window.electronAPI && window.electronAPI.getProjects) {
      const customDir = localStorage.getItem('tasksDir') || undefined
      const data = await window.electronAPI.getProjects(customDir)
      if (data && data.project) projectsData.value = data
    }
  }

  const saveProjects = async () => {
    if (window.electronAPI && window.electronAPI.saveProjects) {
      const customDir = localStorage.getItem('tasksDir') || undefined
      return await window.electronAPI.saveProjects(projectsData.value, customDir)
    }
    return { success: false, error: 'Electron API not available' }
  }

  // 全タグの一覧（重複排除）
  const allTags = computed(() => {
    const tags = new Set()
    Object.values(projectsData.value.project).forEach(p => {
      (p.tags || []).forEach(t => tags.add(t))
    })
    return Array.from(tags).sort()
  })

  // タグでプロジェクトをフィルタ
  const getProjectsByTag = (tag) => {
    return Object.entries(projectsData.value.project)
      .filter(([_, p]) => (p.tags || []).includes(tag))
      .map(([id, p]) => ({ id, ...p }))
  }

  // タグ未設定のプロジェクトを取得
  const getUntaggedProjects = () => {
    return Object.entries(projectsData.value.project)
      .filter(([_, p]) => !p.tags || p.tags.length === 0)
      .map(([id, p]) => ({ id, ...p }))
  }

  // プロジェクト名からID解決（既存プロジェクト検索 → 未発見時は新規作成）
  const resolveProjectId = async (name) => {
    const inputName = name || '未分類'
    for (const [id, proj] of Object.entries(projectsData.value.project)) {
      if (proj.name === inputName) return id
    }
    // 新規作成
    const ids = Object.keys(projectsData.value.project).map(Number).filter(n => !isNaN(n))
    const nextId = String(ids.length > 0 ? Math.max(...ids) + 1 : 1)
    projectsData.value.project[nextId] = { name: inputName, tags: [] }
    await saveProjects()
    return nextId
  }

  return {
    projectsData,
    loadProjects,
    saveProjects,
    allTags,
    getProjectsByTag,
    getUntaggedProjects,
    resolveProjectId
  }
}
