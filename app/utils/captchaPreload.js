const ipcRenderer = require('electron').ipcRenderer;
console.log(global.tokenID);
checkCaptcha = () => {
  console.log('checking');
  let captchaResponse = grecaptcha.getResponse();
  let invisibleCaptcha = document.querySelector('.g-recaptcha').getAttribute('data-size');
  if (invisibleCaptcha === 'invisible') {
    clearInterval(checkCaptcha);
    grecaptcha.execute().then(() => {
      clearInterval(checkCaptcha);
      const captchaResponse3 = grecaptcha.getResponse();
      if (captchaResponse3 !== '') {
        ipcRenderer.send('send-captcha-token', { captchaResponse: captchaResponse3, id: document });
      }
    });
  } else if (captchaResponse !== '') {
    ipcRenderer.send('send-captcha-token', { captchaResponse: captchaResponse, id: document });
    clearInterval(checkCaptcha);
  } else {
    let captchaResponse2 = document.querySelector('#recaptcha-token').value;
    if (captchaResponse2 !== '' && captchaResponse2 !== null) {
      ipcRenderer.send('send-captcha-token', { captchaResponse: captchaResponse, id: document });
      clearInterval(checkCaptcha);
    }
  }
};

if (!window.location.href.includes('google.com')) {
  setInterval(checkCaptcha, 500);
}
// ipcMain.on('send-captcha-token', (event, arg) => {
//   clearInterval(captchaChecker);
// });
