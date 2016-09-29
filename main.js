/////////////////////////////////////////////////////////////////////
// main.js - this file creates windows and handles system events   //
// =======                                                         //
/////////////////////////////////////////////////////////////////////
const electron = require('electron')

const app = electron.app;

const BrowserWindow = electron.BrowserWindow;
const Tray = electron.Tray;

var oTray = null,
    oWin = null;

/////////////////////////////////////////////////////////////////////
// createMainWindow() - creates the main window                    //
// ==================                                              //
/////////////////////////////////////////////////////////////////////
function createMainWindow () {    // Open main (blank) Browser Window
  oWin = new BrowserWindow({
      title: "VIV.AI Code Sameple",
      width: 1024,
      height: 768,
      frame: false
      }
  );

  oWin.loadURL(`file://${__dirname}/index.html`); // Load index.html (NOTE the use of ES6 template String with Ticks vs. quotes)
  oWin.setResizable(false);  // Make the window NOT resizable (no time to write responsive CSS)

  //oWin.webContents.openDevTools();    // Open Debug Tools (Option+CMD+I)

  oWin.on('closed', function () {     // Emitted when the window is closed. Clean up.
    oWin = null
  })

  oTray = new Tray('images/iconForTray_PhotosNearMe.png');  // Add a Tray icon (appears on the top on Mac)
  oTray.on('click', () => {                                 // Toggles display of the Application on click of icon
    oWin.isVisible() ? oWin.hide() : oWin.show();
  })
}

app.on('ready', createMainWindow);  // Once Electron has initialized, call code to create windows

app.on('window-all-closed', function () { // Quit when all windows are closed.
  // On OS X it is common for applications and their menu bar to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {  // If we activate from the System Tray, directly create Windows
  if (oWin === null) {
    createMainWindow()
  }
})
