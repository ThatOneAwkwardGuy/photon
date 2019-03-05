import path from 'path';
import url from 'url';
import { app, crashReporter, BrowserWindow, Menu } from 'electron';
import {
  CAPTCHA_RECEIVE_COOKIES_AND_CAPTCHA_PAGE,
  BOT_SEND_COOKIES_AND_CAPTCHA_PAGE,
  OPEN_CAPTCHA_WINDOW,
  OPEN_LOGS_WINDOW,
  RESET_CAPTCHA_WINDOW,
  SET_GLOBAL_ID_VARIABLE,
  ALERT_UPDATE_AVAILABLE,
  RESET_CAPTCHA_TOKENS_ARRAY,
  RECEIVE_RESET_CAPTCHA_TOKENS_ARRAY,
  SEND_CAPTCHA_TOKEN,
  RECEIVE_CAPTCHA_TOKEN,
  FINISH_SENDING_CAPTCHA_TOKEN,
  MAIN_PROCESS_CLEAR_RECEIVE_CAPTCHA_TOKEN_LISTENERS
} from './utils/constants';
import { autoUpdater } from 'electron-updater';
const ipcMain = require('electron').ipcMain;

const isDevelopment = process.env.NODE_ENV === 'development';

let mainWindow = null;
let captchaWindow = null;
let logWindow = null;
let forceQuit = false;

let initialiseCaptchaWindow = () => {
  captchaWindow = new BrowserWindow({
    webPreferences: {
      contextIsolation: false
    },
    modal: true,
    show: false,
    minWidth: 200,
    minHeight: 300,
    width: 500,
    height: 650,
    frame: false,
    resizable: true,
    focusable: true,
    minimizable: true,
    closable: true,
    allowRunningInsecureContent: true
  });
  captchaWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true,
      hash: 'captcha'
    })
  );
};

let initialiseLogWindow = () => {
  logWindow = new BrowserWindow({
    webPreferences: {
      contextIsolation: false
    },
    modal: true,
    show: false,
    minWidth: 200,
    minHeight: 300,
    width: 500,
    height: 650,
    frame: false,
    resizable: true,
    focusable: true,
    minimizable: true,
    closable: true,
    allowRunningInsecureContent: true
  });
  logWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true,
      hash: 'logs'
    })
  );
};

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  for (const name of extensions) {
    try {
      await installer.default(installer[name], forceDownload);
    } catch (e) {
      console.log(`Error installing ${name} extension: ${e.message}`);
    }
  }
};

// crashReporter.start({
//   productName: 'YourName',
//   companyName: 'YourCompany',
//   submitURL: 'https://your-domain.com/url-to-submit',
//   uploadToServer: false
// });

app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', async () => {
  if (isDevelopment) {
    await installExtensions();
  }
  createMenu();

  mainWindow = new BrowserWindow({
    height: 600,
    width: 900,
    minHeight: 500,
    minWidth: 800,
    frame: false,
    resizable: true
  });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true
    })
  );

  initialiseCaptchaWindow();
  initialiseLogWindow();
  // show window once on first load
  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow.show();
  });

  mainWindow.webContents.on('did-finish-load', () => {
    // Handle window logic properly on macOS:
    // 1. App should not terminate if window has been closed
    // 2. Click on icon in dock should re-open the window
    // 3. ⌘+Q should close the window and quit the app

    if (process.platform === 'darwin') {
      mainWindow.on('close', function(e) {
        if (!forceQuit) {
          e.preventDefault();
          mainWindow.hide();
        }
      });

      app.on('activate', () => {
        mainWindow.show();
      });

      app.on('before-quit', () => {
        forceQuit = true;
      });
    } else {
      mainWindow.on('closed', () => {
        mainWindow = null;
        captchaWindow = null;
      });
    }
  });

  if (isDevelopment) {
    // auto-open dev tools
    mainWindow.webContents.openDevTools();

    // add inspect element on right click menu
    mainWindow.webContents.on('context-menu', (e, props) => {
      Menu.buildFromTemplate([
        {
          label: 'Inspect element',
          click() {
            mainWindow.inspectElement(props.x, props.y);
          }
        }
      ]).popup(mainWindow);
    });
  }

  ipcMain.on(BOT_SEND_COOKIES_AND_CAPTCHA_PAGE, (event, args) => {
    captchaWindow.send(CAPTCHA_RECEIVE_COOKIES_AND_CAPTCHA_PAGE, args);
  });

  ipcMain.on(OPEN_CAPTCHA_WINDOW, (event, arg) => {
    if (captchaWindow.isDestroyed()) {
      initialiseCaptchaWindow();
      captchaWindow.show();
    } else {
      captchaWindow.show();
    }
  });

  ipcMain.on(OPEN_LOGS_WINDOW, (event, arg) => {
    if (logWindow.isDestroyed()) {
      initialiseLogWindow();
      logWindow.show();
    } else {
      logWindow.show();
    }
  });

  ipcMain.on(MAIN_PROCESS_CLEAR_RECEIVE_CAPTCHA_TOKEN_LISTENERS, (event, arg) => {
    ipcMain.removeAllListeners(RECEIVE_CAPTCHA_TOKEN);
  });

  ipcMain.on(RESET_CAPTCHA_TOKENS_ARRAY, (event, arg) => {
    captchaWindow.send(RECEIVE_RESET_CAPTCHA_TOKENS_ARRAY, 'reset');
  });

  ipcMain.on(SET_GLOBAL_ID_VARIABLE, (event, arg) => {
    global.captcaTokenID = arg;
    event.returnValue = true;
  });

  ipcMain.on(SEND_CAPTCHA_TOKEN, (event, arg) => {
    mainWindow.send(RECEIVE_CAPTCHA_TOKEN, arg);
    console.log(arg.id);
  });

  ipcMain.on(FINISH_SENDING_CAPTCHA_TOKEN, (event, arg) => {
    captchaWindow.send(FINISH_SENDING_CAPTCHA_TOKEN, arg);
  });

  ipcMain.on(RESET_CAPTCHA_WINDOW, (event, arg) => {
    captchaWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true,
        hash: 'captcha'
      })
    );
  });

  autoUpdater.on('update-downloaded', info => {
    mainWindow.send(ALERT_UPDATE_AVAILABLE, info);
  });
});

function createMenu() {
  const application = {
    label: 'Photon',
    submenu: [
      {
        label: 'Quit',
        accelerator: 'Command+Q',
        click: () => {
          app.quit();
        }
      }
    ]
  };

  const edit = {
    label: 'Edit',
    submenu: [
      {
        label: 'Undo',
        accelerator: 'CmdOrCtrl+Z',
        selector: 'undo:'
      },
      {
        label: 'Redo',
        accelerator: 'Shift+CmdOrCtrl+Z',
        selector: 'redo:'
      },
      {
        type: 'separator'
      },
      {
        label: 'Cut',
        accelerator: 'CmdOrCtrl+X',
        selector: 'cut:'
      },
      {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        selector: 'copy:'
      },
      {
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        selector: 'paste:'
      },
      {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        selector: 'selectAll:'
      }
    ]
  };

  const dev = {
    label: 'Dev',
    submenu: [
      {
        label: 'Refresh',
        accelerator: 'CmdOrCtrl+R',
        click(item, focusedWindow) {
          if (focusedWindow) focusedWindow.reload();
        }
      },
      {
        label: 'Toggle Developer Tools',
        accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
        click(item, focusedWindow) {
          if (focusedWindow) focusedWindow.webContents.toggleDevTools();
        }
      },
      {
        type: 'separator'
      },
      {
        role: 'resetzoom'
      },
      {
        role: 'zoomin'
      },
      {
        role: 'zoomout'
      },
      {
        type: 'separator'
      },
      {
        role: 'togglefullscreen'
      }
    ]
  };

  const template = [application, edit];

  if (isDevelopment) {
    template.push(dev);
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// app.on('login', (event, webContents, request, authInfo, callback) => {
//   event.preventDefault();
// });
