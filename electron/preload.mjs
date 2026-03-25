import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    sendMessage: (message) => ipcRenderer.send('message', message),
    onMessage: (callback) => ipcRenderer.on('message', (_event, value) => callback(value)),
    saveMarkdown: (filename, content, customDirPath) => ipcRenderer.invoke('save-markdown', filename, content, customDirPath),
    updateMarkdownStatus: (filename, status, customDirPath) => ipcRenderer.invoke('update-markdown-status', filename, status, customDirPath),
    getAllMarkdowns: (customDirPath) => ipcRenderer.invoke('get-all-markdowns', customDirPath),
    getProjects: (customDirPath) => ipcRenderer.invoke('get-projects', customDirPath),
    saveProjects: (data, customDirPath) => ipcRenderer.invoke('save-projects', data, customDirPath),
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    saveWeeklyReport: (content, customDirPath) => ipcRenderer.invoke('save-weekly-report', content, customDirPath),
    // SafeStorage API
    isSafeStorageAvailable: () => ipcRenderer.invoke('safe-storage-is-available'),
    encryptString: (plainText) => ipcRenderer.invoke('safe-storage-encrypt', plainText),
    decryptString: (encryptedHex) => ipcRenderer.invoke('safe-storage-decrypt', encryptedHex),
    openExternal: (url) => ipcRenderer.invoke('open-external', url)
})
