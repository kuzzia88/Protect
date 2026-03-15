const { app, BrowserWindow, Menu, ipcMain, desktopCapturer, remote, ipcRenderer } = require('electron');
const fs = require('fs').promises;
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    resizable: false,
    transparent: true,
    frame: false,
    opacity: 0.98,
    hasShadow: true,
    icon: path.join(__dirname, 'assets/icon.ico'),
    titleBarStyle: 'hiddenInset',
    webPreferences: {
        enableRemoteModule: true,
        nodeIntegration: true,
        contextIsolation: false
    },
  })

  ipcMain.on('window-minimize', () => {
      win.minimize()
    })
  
  ipcMain.on('window-maximize', () => {
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  })

  ipcMain.on('window-close', () => {
    win.close()
  })

  Menu.setApplicationMenu(null);
  win.loadFile('index.html')

  win.webContents.openDevTools();
}

ipcMain.on('save-image', async (event, { fileName, buffer }) => {
  try {
    const appPath = app.getAppPath();
    const filePath = path.join(appPath, fileName);
    
    await fs.writeFile(filePath, buffer);
    
    event.sender.send('save-image-reply', {
      success: true,
      filePath: filePath
    });
  } catch (error) {
    event.sender.send('save-image-reply', {
      success: false,
      error: error.message
    });
  }
});

ipcMain.on('save-file', async (event, { fileName, buffer }) => {
  try {
    const appPath = app.getAppPath();
    const filePath = path.join(appPath, fileName);
    
    await fs.writeFile(filePath, buffer);
    
    event.sender.send('save-file-reply', {
      success: true,
      filePath: filePath
    });
  } catch (error) {
    event.sender.send('save-file-reply', {
      success: false,
      error: error.message
    });
  }
});

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})