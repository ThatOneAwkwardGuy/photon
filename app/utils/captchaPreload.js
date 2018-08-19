const ipcRenderer = require('electron').ipcRenderer;
const ipcMain = require('electron').ipcMain;

checkCaptcha = () => {
  console.log('checking');
  let captchaResponse = grecaptcha.getResponse();
  if (captchaResponse !== '') {
    console.log(captchaResponse);
    ipcRenderer.send('send-captcha-token', captchaResponse);
    clearInterval(captchaChecker);
  }
};

if (!window.location.href.includes('google.com')) {
  setInterval(checkCaptcha, 500);
}
// ipcMain.on('send-captcha-token', (event, arg) => {
//   clearInterval(captchaChecker);
// });
