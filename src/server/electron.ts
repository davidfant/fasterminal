import {app, BrowserWindow} from 'electron';

function createWindow() {
    const mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      titleBarStyle: 'hidden',
    });
    mainWindow.loadURL('http://localhost:3000');
    // mainWindow.setBackgroundColor('#0F131A');
}

app.on('ready', createWindow);
