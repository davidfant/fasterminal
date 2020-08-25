import {app, BrowserWindow} from 'electron';
import isDev from 'electron-is-dev';
import fixPath from 'fix-path';
import * as path from 'path';
import './index';

// https://github.com/electron/electron/issues/7688#issuecomment-255640358
fixPath();

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    titleBarStyle: 'hidden'
  });
  mainWindow.loadURL(isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../../build/index.html')}`);
  // webview.insertCSS(“body { background-color: red !important; }”);
  mainWindow.webContents.on('did-finish-load', function() {
    mainWindow.webContents.insertCSS(`
      .terminal-output {
        padding-top: 16px;
      }
    `);
 });
}

app.on('ready', createWindow);
