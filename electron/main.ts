import { app, BrowserWindow, ipcMain, dialog, safeStorage } from 'electron'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

process.env.DIST = path.join(__dirname, '../dist')

let win: BrowserWindow | null

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

function createWindow() {
    process.env.VITE_PUBLIC = app.isPackaged ? (process.env.DIST as string) : path.join(__dirname, '../public')
    win = new BrowserWindow({
        icon: path.join((process.env.VITE_PUBLIC as string) || '', 'favicon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        width: 1200,
        height: 800,
        autoHideMenuBar: true, // Hide the standard Windows menu bar
    })

    // Remove the default application menu completely
    win.setMenu(null)

    if (win && win.webContents) {
        // Test active push message to Renderer-process.
        win.webContents.on('did-finish-load', () => {
            if (win && win.webContents) {
                win.webContents.send('main-process-message', (new Date).toLocaleString())
            }
        })

        // Enable F12 to toggle DevTools since the standard menu is hidden
        win.webContents.on('before-input-event', (event, input) => {
            if (input.key === 'F12' && win && win.webContents) {
                win.webContents.toggleDevTools()
                event.preventDefault()
            }
        })
    }

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL)
    } else {
        win.loadFile(path.join(process.env.DIST || '', 'index.html'))
    }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
        win = null
    }
})

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

// IPC Handlers for File System
ipcMain.handle('select-directory', async () => {
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
        properties: ['openDirectory'],
        title: '保存先のフォルダを選択してください (Select Save Directory)'
    })

    if (result.canceled || result.filePaths.length === 0) {
        return null
    }

    // Make sure we handle Japanese and Windows paths correctly
    return result.filePaths[0]
})

// SafeStorage Handlers for sensitive data
ipcMain.handle('safe-storage-is-available', () => {
    return safeStorage.isEncryptionAvailable()
})

ipcMain.handle('safe-storage-encrypt', (event, plainText: string) => {
    try {
        if (!safeStorage.isEncryptionAvailable()) {
            console.warn('SafeStorage is not available. Saving as plain text.')
            return plainText
        }
        const encrypted = safeStorage.encryptString(plainText)
        return encrypted.toString('hex')
    } catch (error) {
        console.error('Encryption failed:', error)
        return plainText
    }
})

ipcMain.handle('safe-storage-decrypt', (event, encryptedHex: string) => {
    try {
        if (!encryptedHex || typeof encryptedHex !== 'string') {
            return encryptedHex
        }

        if (!safeStorage.isEncryptionAvailable()) {
            return encryptedHex
        }

        // Basic check: is it a valid hex string?
        const isHex = /^[0-9a-fA-F]+$/.test(encryptedHex)
        // safeStorage items are typically long hex strings. 
        // If it's not hex or too short, it's likely plain text (migration case).
        if (!isHex || encryptedHex.length < 16) {
            return encryptedHex
        }

        const buffer = Buffer.from(encryptedHex, 'hex')
        return safeStorage.decryptString(buffer)
    } catch (error: any) {
        // If decryption fails, it might be already plain text (migration case)
        console.warn('[SafeStorage] Decryption failed, returning as plain text:', error.message)
        return encryptedHex
    }
})

ipcMain.handle('open-external', async (event, url) => {
    const { shell } = require('electron')
    await shell.openExternal(url)
})

ipcMain.handle('save-markdown', async (event, filename: string, content: string, customDirPath?: string) => {
    try {
        const rootDir = customDirPath ? customDirPath : path.join(app.getAppPath(), 'content', 'tasks')
        const targetDir = path.join(rootDir, 'tasks')
        const filePath = path.join(targetDir, filename)

        // Ensure directory exists
        const dir = path.dirname(filePath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }

        await fs.promises.writeFile(filePath, content, 'utf-8')
        return { success: true, path: filePath }
    } catch (error: any) {
        console.error('Failed to save markdown:', error)
        return { success: false, error: error.message }
    }
})

ipcMain.handle('update-markdown-status', async (event, filename: string, newStatus: string, customDirPath?: string) => {
    try {
        console.log(`[IPC] update-markdown-status called with filename: ${filename}, newStatus: ${newStatus}`)
        const rootDir = customDirPath ? customDirPath : path.join(app.getAppPath(), 'content', 'tasks')
        const targetDir = path.join(rootDir, 'tasks')
        const filePath = path.join(targetDir, filename)
        if (!fs.existsSync(filePath)) throw new Error('File not found at ' + filePath)

        const content = await fs.promises.readFile(filePath, 'utf-8')
        const matter = require('gray-matter')
        let parsed = matter(content)

        // Safe front-matter modification
        parsed.data.status = newStatus
        parsed.data.updated_at = new Date().toISOString()

        const newContent = matter.stringify(parsed.content, parsed.data)

        await fs.promises.writeFile(filePath, newContent, 'utf-8')
        console.log(`[IPC] successfully updated status of ${filename}`)
        return { success: true }
    } catch (error: any) {
        console.error('Failed to update status:', error)
        return { success: false, error: error.message }
    }
})

ipcMain.handle('get-projects', async (event, customDirPath?: string) => {
    try {
        const targetDir = customDirPath ? customDirPath : path.join(app.getAppPath(), 'content', 'tasks')
        const filePath = path.join(targetDir, 'projects.json')

        if (!fs.existsSync(filePath)) {
            const defaultData = {
                project: {
                    "1": { name: "Inbox (未分類)" }
                }
            }
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true })
            }
            await fs.promises.writeFile(filePath, JSON.stringify(defaultData, null, 2), 'utf-8')
            return defaultData
        }

        const content = await fs.promises.readFile(filePath, 'utf-8')
        return JSON.parse(content)
    } catch (error) {
        console.error('Failed to get projects:', error)
        return { project: {} }
    }
})

ipcMain.handle('save-projects', async (event, data: any, customDirPath?: string) => {
    try {
        const targetDir = customDirPath ? customDirPath : path.join(app.getAppPath(), 'content', 'tasks')
        const filePath = path.join(targetDir, 'projects.json')

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true })
        }

        await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
        return { success: true }
    } catch (error: any) {
        console.error('Failed to save projects:', error)
        return { success: false, error: error.message }
    }
})

ipcMain.handle('save-report', async (event, filename: string, content: string, customDirPath?: string) => {
    try {
        const rootDir = customDirPath ? path.dirname(customDirPath) : path.join(app.getAppPath(), 'content')
        const targetDir = path.join(rootDir, 'reports')
        
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true })
        }

        const filePath = path.join(targetDir, filename)

        await fs.promises.writeFile(filePath, content, 'utf-8')
        return { success: true, path: filePath }
    } catch (error: any) {
        console.error('Failed to save report:', error)
        return { success: false, error: error.message }
    }
})

ipcMain.handle('get-all-reports', async (event, customDirPath?: string) => {
    try {
        const rootDir = customDirPath ? path.dirname(customDirPath) : path.join(app.getAppPath(), 'content')
        const targetDir = path.join(rootDir, 'reports')
        
        if (!fs.existsSync(targetDir)) {
           return []
        }

        const fg = require('fast-glob')
        const files = await fg('**/*.md', { cwd: targetDir })
        
        const matter = require('gray-matter')
        const reports = []
        for (const file of files) {
            const filePath = path.join(targetDir, file)
            const content = await fs.promises.readFile(filePath, 'utf-8')
            const stats = await fs.promises.stat(filePath)
            const parsed = matter(content)
            
            reports.push({
                _file: file,
                ...parsed.data,
                content: parsed.content,
                updated_at: stats.mtime.toISOString(),
                created_at: stats.ctime.toISOString()
            })
        }
        
        return reports.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } catch (error: any) {
        console.error('Failed to get reports:', error)
        return []
    }
})

// Add new IPC handler for getting all markdown files
ipcMain.handle('get-all-markdowns', async (event, customDirPath?: string) => {
    try {
        const rootDir = customDirPath ? customDirPath : path.join(app.getAppPath(), 'content', 'tasks')
        const tasksDir = path.join(rootDir, 'tasks')

        // Migration step: move existing .md files from rootDir to tasksDir
        if (fs.existsSync(rootDir)) {
             if (!fs.existsSync(tasksDir)) {
                 fs.mkdirSync(tasksDir, { recursive: true })
             }
             const rootFiles = await fs.promises.readdir(rootDir)
             for (const rootFile of rootFiles) {
                  if (rootFile.endsWith('.md') && rootFile !== 'accumulation.md' && rootFile !== 'README.md') {
                       const oldPath = path.join(rootDir, rootFile)
                       const newPath = path.join(tasksDir, rootFile)
                       try {
                           await fs.promises.rename(oldPath, newPath)
                           console.log(`[Migration] Moved ${rootFile} to tasks directory.`)
                       } catch(e) {
                           console.log(`[Migration] Failed to move ${rootFile}`, e)
                       }
                  }
             }
        }

        if (!fs.existsSync(tasksDir)) {
            return []
        }

        // Read projects.json to sync names and handle unmapped
        const projectsFilePath = path.join(rootDir, 'projects.json')
        let projectsData: any = { project: { "1": { name: "Inbox (未分類)" } } }
        let projectsChanged = false
        if (fs.existsSync(projectsFilePath)) {
            try {
                projectsData = JSON.parse(await fs.promises.readFile(projectsFilePath, 'utf-8'))
            } catch (e) { }
        }

        const files = await fs.promises.readdir(tasksDir)
        const markdowns: any[] = []

        for (const file of files) {
            if (file.endsWith('.md')) {
                const filePath = path.join(tasksDir, file)
                const content = await fs.promises.readFile(filePath, 'utf-8')
                const matter = require('gray-matter')
                const parsed = matter(content)

                let fileChanged = false

                // Migration: legacy status standardization
                if (parsed.data.status === 'inProgress') {
                    parsed.data.status = 'in-progress'
                    fileChanged = true
                } else if (parsed.data.status === 'archived') {
                    parsed.data.status = 'done'
                    fileChanged = true
                }

                // Ensure new schema fields exist
                if (parsed.data.priority === undefined) { parsed.data.priority = "Medium"; fileChanged = true; }
                if (parsed.data.tags === undefined) { parsed.data.tags = []; fileChanged = true; }

                // Migration: legacy 'project' -> 'project_id' and 'project_name'
                if (!parsed.data.project_id) {
                    const legacyName = parsed.data.project || "Inbox (未分類)"

                    // Find matching project
                    let matchId = Object.keys(projectsData.project).find(key => projectsData.project[key].name === legacyName)

                    if (!matchId) {
                        // Create new ID
                        const ids = Object.keys(projectsData.project).map(Number).filter(n => !isNaN(n))
                        const nextId = ids.length > 0 ? Math.max(...ids) + 1 : 1
                        matchId = nextId.toString()
                        projectsData.project[matchId] = { name: legacyName }
                        projectsChanged = true
                    }

                    parsed.data.project_id = matchId
                    parsed.data.project_name = legacyName
                    delete parsed.data.project
                    fileChanged = true
                } else {
                    // Sync name from projects.json
                    const pid = String(parsed.data.project_id)
                    if (projectsData.project[pid] && projectsData.project[pid].name !== parsed.data.project_name) {
                        parsed.data.project_name = projectsData.project[pid].name
                        fileChanged = true
                    }
                }

                if (fileChanged) {
                    const newContent = matter.stringify(parsed.content, parsed.data)
                    await fs.promises.writeFile(filePath, newContent, 'utf-8')
                }

                markdowns.push({
                    _file: file,
                    _path: `/tasks/${file.replace('.md', '')}`, // Compatibility with some old Nuxt Content logic if needed
                    ...parsed.data, // Front-matter properties (title, project, status, etc)
                    body: parsed.content // Raw markdown body
                })
            }
        }

        if (projectsChanged) {
            await fs.promises.writeFile(projectsFilePath, JSON.stringify(projectsData, null, 2), 'utf-8')
        }

        return markdowns
    } catch (error) {
        console.error('Failed to get markdowns:', error)
        return []
    }
})

app.whenReady().then(createWindow)
