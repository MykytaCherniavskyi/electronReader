// Модуль контроля жизненого цикла приложения и создания нативных окон
const {app, BrowserWindow, Menu, ipcMain, dialog} = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');

// SET ENV консоль для дебага
// process.env.NODE_ENV = 'production';

// Место хранение глобальных переменных для окон приложения.
let mainWindow;
let addWindow;

function createWindow () {
  // Создание браузерного окна
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      plugins: true,
      nodeIntegration: true,
    }
  });

  // загрузка index.html страницы приложения
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Построения меню из шаблона
  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  // Установить меню
  Menu.setApplicationMenu(mainMenu);

  // Обработчик закрытия главного окна
  mainWindow.on('closed', function () {
    app.quit();
  })
}

// обработчик создания доп окна
function createAddWindow() {
  // создания нового окна
  addWindow = new BrowserWindow({
    width: 300,
    height: 150,
    title: 'Add Rule',
    webPreferences: {
      nodeIntegration: true,
    }
  });

  // загрузка страницы для окна
  addWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'addRuleWindow.html'),
    protocol: 'file:',
    slashes: true
  }));

  addWindow.removeMenu();

  // обработчик закрытия доп окна
  addWindow.on('close', function () {
    addWindow = null;
  })
}

// Обработка добавления правила из доп окна и отправка этого правила в на страницу главного окна
ipcMain.on('rule:add', function (e, rule) {
  mainWindow.webContents.send('rule:add', rule);
  addWindow.close();
});

// Обработка перенесенного файла
ipcMain.on('ondrop', fileReader);

// Чтение файла и отправка данных в главное окно
function fileReader(e, filePath) {
  const data = fs.readFileSync(filePath, 'utf8');
  mainWindow.webContents.send('fileData', data);
}

// Шаблон меню
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
              // берется первый путь к файлу
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

// Метод для создания окна, когда electron будет готов
app.on('ready', createWindow);

// обработка закрытия всех окон
app.on('window-all-closed', function () {
  // macos command+Q для выхода
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  // пересоздания окна, если по клику по иконке нету главного окна
  if (mainWindow === null) createWindow();
});

// добавление developer tools, если не продакшен мод
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
