const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // Splash Screen
  const splash = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    transparent: false,
    backgroundColor: '#1e1e2f'
  });

  splash.loadFile(path.join(__dirname, 'preload.html'));

  // Janela principal
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    show: false,
    icon: path.join(__dirname, 'assets/pic/icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Mostra a janela principal depois de um tempo
  setTimeout(() => {
    splash.close();
    mainWindow.show();
  }, 2500); // 2.5 segundos de splash
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
