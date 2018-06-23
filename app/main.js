import path from 'path';
import url from 'url';
import { app, crashReporter, BrowserWindow, Menu, dialog } from 'electron';
import { auth, database } from './api/firebase/';
import { SEND_SUPREME_CHECKOUT_COOKIE, RECEIVE_SUPREME_CHECKOUT_COOKIE, OPEN_CAPTCHA_WINDOW, SEND_SUPREME_CAPTCHA_URL, RECEIVE_SUPREME_CAPTCHA_URL, ALERT_RENDERER_OF_QUIT, ALERT_UPDATE_AVAILABLE, CHECK_FOR_UPDATE, BEGIN_UPDATE } from './utils/constants';
import { autoUpdater } from 'electron-updater';
const ipcMain = require('electron').ipcMain;

const isDevelopment = process.env.NODE_ENV === 'development';

let mainWindow = null;
let captchaWindow = null;
let forceQuit = false;

let initialiseCaptchaWindow = () => {
  captchaWindow = new BrowserWindow({
    modal: true,
    show: false,
    minWidth: 400,
    minHeight: 600,
    width: 400,
    height: 600,
    resizable: false,
    frame: false
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

crashReporter.start({
  productName: 'YourName',
  companyName: 'YourCompany',
  submitURL: 'https://your-domain.com/url-to-submit',
  uploadToServer: false
});

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
  // autoUpdater.setFeedURL({
  //   token: "912c34e85a9d67783b0edd1982f6e5d1bc6a124e",
  //   owner: "ThatOneAwkwardGuy",
  //   repo: "photon",
  //   provider: "github"
  // });
  // ipcMain.on(CHECK_FOR_UPDATE, (event, arg) => {
  //   autoUpdater.checkForUpdates();
  // });
  // ipcMain.on(BEGIN_UPDATE, (event, arg) => {
  //   autoUpdater.quitAndInstall();
  // });
  mainWindow = new BrowserWindow({
    height: 800,
    width: 1324,
    minHeight: 1324,
    minWidth: 800,
    frame: false,
    resizable: false
  });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true
    })
  );

  initialiseCaptchaWindow();

  ipcMain.on(SEND_SUPREME_CHECKOUT_COOKIE, (event, arg) => {
    captchaWindow.send(RECEIVE_SUPREME_CHECKOUT_COOKIE, arg);
  });

  ipcMain.on(SEND_SUPREME_CAPTCHA_URL, (event, arg) => {
    mainWindow.send(RECEIVE_SUPREME_CAPTCHA_URL, arg);
  });

  ipcMain.on(OPEN_CAPTCHA_WINDOW, (event, arg) => {
    if (captchaWindow.isDestroyed()) {
      initialiseCaptchaWindow();
      captchaWindow.show();
    } else {
      captchaWindow.show();
    }
  });

  autoUpdater.on('update-downloaded', info => {
    mainWindow.send(ALERT_UPDATE_AVAILABLE, info);
  });

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
        mainWindow.send(ALERT_RENDERER_OF_QUIT, true);
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
});
