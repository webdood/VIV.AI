// main.js - this file creates windows and handles system events
// =======
///////////////////////
const electron = require('electron')

const app = electron.app;

const BrowserWindow = electron.BrowserWindow;

var oWin;

function createWindow () {
  oWin = new BrowserWindow({width: 900, height: 600});  // Open main (blank) Browser Window

  oWin.loadURL(`file://${__dirname}/index.html`); // Load index.html (NOTE the use of ES6 template String with Ticks vs. quotes)

  //oWin.webContents.openDevTools();    // Open Debug Tools (Option+CMD+I)

  oWin.on('closed', function () {     // Emitted when the window is closed. Clean up.
    oWin = null
  })
}

app.on('ready', createWindow);  // Once Electron has initialized, call code to create windows

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (oWin === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
