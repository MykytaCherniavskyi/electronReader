// Modules to control application life and create native browser window
const {app, BrowserWindow, Menu, ipcMain, dialog} = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');

// SET ENV
// process.env.NODE_ENV = 'production';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let addWindow;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      plugins: true,
      nodeIntegration: true,
    }
  });

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Build menu from template
  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  // Insert menu
  Menu.setApplicationMenu(mainMenu);

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    app.quit();
  })
}

// handle add window
function createAddWindow() {
  // create new window
  addWindow = new BrowserWindow({
    width: 300,
    height: 150,
    title: 'Add Rule',
    webPreferences: {
      nodeIntegration: true,
    }
  });

  // and load the html of the app.
  addWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'addRuleWindow.html'),
    protocol: 'file:',
    slashes: true
  }));

  addWindow.removeMenu();

  // Garbage collection handle
  addWindow.on('close', function () {
    addWindow = null;
  })
}

// Catch Item Add
ipcMain.on('rule:add', function (e, rule) {
  mainWindow.webContents.send('rule:add', rule);
  addWindow.close();
});

// Drag Catch
ipcMain.on('ondrop', fileReader);

function fileReader(e, filePath) {
  const data = fs.readFileSync(filePath, 'utf8');
  mainWindow.webContents.send('fileData', data);
}

//create menu template
// accelerator - hot key
// darwin - mac
const mainMenuTemplate = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Add Rule',
        click() {
          createAddWindow();
        }
      },
      {
        label: 'Clear Rules',
        click() {
          mainWindow.webContents.send('rule:clear');
        }
      },
      {
        label: 'Select File',
        click() {
          dialog.showOpenDialog(mainWindow, {
            properties: ['openFile']
          }).then(result => {
            if (!result.canceled) {
              const [filePath] = result.filePaths;
              fileReader(null, filePath);
            }
          }).catch(err => {
            console.log(err);
          })
        }
      },
      {
        label: 'Quit',
        accelerator: process.platform === 'darwin' ? 'Command+Q' : 'Ctrl+Q',
        click() {
          app.quit();
        }
      }
    ]
  }
];

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});

// Add developer tools item if not in production mode
if (process.env.NODE_ENV !== 'production') {
  mainMenuTemplate.push({
    label: 'Developer tools',
    submenu: [
      {
        label: 'Toggle DevTools',
        accelerator: process.platform === 'darwin' ? 'Command+I' : 'Ctrl+I',
        click(item, focusedWindow) {
          focusedWindow.toggleDevTools();
        }
      },
      {
        role: 'reload'
      }
    ]
  })
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
