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

ipcMain.handle('append-accumulation', async (event, items: any[], customDirPath?: string) => {
    try {
        const rootDir = customDirPath ? customDirPath : path.join(app.getAppPath(), 'content', 'tasks')
        const filePath = path.join(rootDir, 'accumulation.md')

        if (!fs.existsSync(rootDir)) {
            fs.mkdirSync(rootDir, { recursive: true })
        }

        // Format items
        let appendContent = ''
        for (const item of items) {
           appendContent += `\n## project：${item.project_name} (id: ${item.project_id})\n`
           appendContent += `### title：${item.title}\n`
           appendContent += `<!-- file: ${item.filename} -->\n`
           
           if (item.details) {
              const lines = item.details.split('\\n')
              const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })
              for (const line of lines) {
                 if (line.trim()) {
                    let formattedLine = line.trim()
                    // Strip existing leading bullet points if user added them
                    if (formattedLine.startsWith('- ') || formattedLine.startsWith('・') || formattedLine.startsWith('⇒')) {
                       formattedLine = formattedLine.substring(1).trim()
                    }
                    appendContent += `- [${today}] ${formattedLine}\n`
                 }
              }
           }
        }

        if (!appendContent) {
           return { success: true, message: 'No content to append' } // Empty
        }

        let existingContent = ''
        if (fs.existsSync(filePath)) {
            existingContent = await fs.promises.readFile(filePath, 'utf-8')
            if (existingContent.trim()) existingContent += '\n\n'
        }

        await fs.promises.writeFile(filePath, existingContent + appendContent.trim(), 'utf-8')
        return { success: true }
    } catch (error: any) {
        console.error('Failed to append accumulation:', error)
        return { success: false, error: error.message }
    }
})

ipcMain.handle('read-accumulation', async (event, customDirPath?: string) => {
    try {
        const rootDir = customDirPath ? customDirPath : path.join(app.getAppPath(), 'content', 'tasks')
        const filePath = path.join(rootDir, 'accumulation.md')
        
        if (!fs.existsSync(filePath)) {
            return { success: true, content: '' }
        }
        
        const content = await fs.promises.readFile(filePath, 'utf-8')
        return { success: true, content }
    } catch (error: any) {
        console.error('Failed to read accumulation:', error)
        return { success: false, error: error.message }
    }
})

ipcMain.handle('write-accumulation', async (event, content: string, customDirPath?: string) => {
    try {
        const rootDir = customDirPath ? customDirPath : path.join(app.getAppPath(), 'content', 'tasks')
        const filePath = path.join(rootDir, 'accumulation.md')
        
        if (!fs.existsSync(rootDir)) {
            fs.mkdirSync(rootDir, { recursive: true })
        }
        
        await fs.promises.writeFile(filePath, content, 'utf-8')
        return { success: true }
    } catch (error: any) {
        console.error('Failed to write accumulation:', error)
        return { success: false, error: error.message }
    }
})

ipcMain.handle('distribute-accumulation', async (event, customDirPath?: string) => {
    try {
        const rootDir = customDirPath ? customDirPath : path.join(app.getAppPath(), 'content', 'tasks')
        const accumFile = path.join(rootDir, 'accumulation.md')
        const tasksDir = path.join(rootDir, 'tasks')

        if (!fs.existsSync(accumFile)) {
            return { success: true, message: 'No accumulation file found' }
        }

        const accumContent = await fs.promises.readFile(accumFile, 'utf-8')
        if (!accumContent.trim()) {
            return { success: true, message: 'Accumulation file is empty' }
        }

        // Load projects data for metadata resolution
        const projectsFilePath = path.join(rootDir, 'projects.json')
        let projectsData: any = { project: { "1": { name: "Inbox (未分類)" } } }
        let projectsChanged = false
        if (fs.existsSync(projectsFilePath)) {
            try {
                projectsData = JSON.parse(await fs.promises.readFile(projectsFilePath, 'utf-8'))
            } catch (e) {
                console.error('[Distribute] Failed to parse projects.json:', e)
            }
        }

        const lines = accumContent.split('\n')
        
        let currentFile = ''
        let currentProjectId = ''
        let currentProjectName = ''
        let currentTitle = ''
        const fileContentMap: Record<string, string[]> = {}
        const fileMetaMap: Record<string, { project_id: string, project_name: string, title: string }> = {}

        // Parse accumulation file line by line
        for (const line of lines) {
            // Parse project info
            const projMatch = line.match(/^## project：(.+?) \(id: (.+?)\)$/)
            if (projMatch) {
                currentProjectName = projMatch[1]
                currentProjectId = projMatch[2]
            }

            // Parse task title
            const titleMatch = line.match(/^### title：(.+)$/)
            if (titleMatch) {
                currentTitle = titleMatch[1]
            }

            const fileMatch = line.match(/^<!-- file:\s*(.+?)\s*-->$/)
            if (fileMatch) {
                currentFile = fileMatch[1]
                if (!fileContentMap[currentFile]) {
                    fileContentMap[currentFile] = []
                }
                // Record metadata for this file
                fileMetaMap[currentFile] = {
                    project_id: currentProjectId,
                    project_name: currentProjectName,
                    title: currentTitle
                }
            } else if (line.trim().startsWith('- [') && currentFile) {
                // It's a task detail line
                fileContentMap[currentFile].push(line)
            } else if (line.trim() && !line.startsWith('##') && !line.startsWith('###') && currentFile) {
                // some other text under the file
                fileContentMap[currentFile].push(line)
            }
        }

        const matter = require('gray-matter')

        // Distribute to individual files
        for (const [filename, newLines] of Object.entries(fileContentMap)) {
             if (newLines.length === 0) continue
             
             const targetPath = path.join(tasksDir, filename)
             if (!fs.existsSync(targetPath)) {
                 console.log(`[Distribute] Target ${filename} not found. Creating new task file.`)

                 const taskMeta = fileMetaMap[filename]
                 if (!taskMeta || !taskMeta.title) {
                     console.warn(`[Distribute] No metadata found for ${filename}. Skipping.`)
                     continue
                 }

                 // Project existence check and auto-creation
                 let projectId = taskMeta.project_id
                 const projectName = taskMeta.project_name || 'Inbox (未分類)'

                 if (projectId && !projectsData.project[projectId]) {
                     projectsData.project[projectId] = { name: projectName, tags: [] }
                     projectsChanged = true
                 } else if (!projectId) {
                     // Resolve by name if id is unknown
                     const matchEntry = Object.entries(projectsData.project)
                         .find(([_, p]: [string, any]) => p.name === projectName)
                     if (matchEntry) {
                         projectId = matchEntry[0]
                     } else {
                         const ids = Object.keys(projectsData.project).map(Number).filter(n => !isNaN(n))
                         projectId = String(ids.length > 0 ? Math.max(...ids) + 1 : 1)
                         projectsData.project[projectId] = { name: projectName, tags: [] }
                         projectsChanged = true
                     }
                 }

                 // Create new task file
                 const newFrontmatter = matter.stringify('', {
                     id: `auto-${Date.now()}`,
                     title: taskMeta.title,
                     project_id: projectId,
                     project_name: projectName,
                     status: 'inProgress',
                     created_at: new Date().toISOString(),
                     updated_at: new Date().toISOString()
                 })

                 if (!fs.existsSync(tasksDir)) {
                     fs.mkdirSync(tasksDir, { recursive: true })
                 }

                 await fs.promises.writeFile(targetPath, newFrontmatter, 'utf-8')
                 console.log(`[Distribute] Created new task file: ${targetPath}`)
             }

             const content = await fs.promises.readFile(targetPath, 'utf-8')
             let parsed = matter(content)
             
             let appendBody = '\n\n'
             for (const line of newLines) {
                  // extract date if matches - [YYYY/MM/DD]
                  const dateMatch = line.match(/^- \[(\d{4}\/\d{2}\/\d{2})\]/)
                  if (dateMatch) {
                      const dateStr = dateMatch[1]
                      appendBody += `\n## [${dateStr}]\n${line}\n`
                  } else {
                      appendBody += `${line}\n`
                  }
             }

             // Append details to body
             const newContentString = matter.stringify(parsed.content + appendBody.trimEnd(), parsed.data)
             await fs.promises.writeFile(targetPath, newContentString, 'utf-8')
        }

        // Save projects if updated
        if (projectsChanged) {
            await fs.promises.writeFile(projectsFilePath, JSON.stringify(projectsData, null, 2), 'utf-8')
        }

        // Clear accumulation file
        await fs.promises.writeFile(accumFile, '', 'utf-8')

        return { success: true }
    } catch (error: any) {
        console.error('Failed to distribute accumulation:', error)
        return { success: false, error: error.message }
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
