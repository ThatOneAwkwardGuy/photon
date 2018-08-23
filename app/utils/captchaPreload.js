const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote;

checkCaptcha = () => {
  console.log('Checking For Captcha');
  const tokenID = remote.getGlobal('captcaTokenID');
  let captchaResponse = grecaptcha.getResponse();
  let invisibleCaptcha = document.querySelector('.g-recaptcha').getAttribute('data-size');
  if (invisibleCaptcha === 'invisible') {
    clearInterval(checkCaptcha);
    grecaptcha.execute().then(() => {
      clearInterval(checkCaptcha);
      const captchaResponse3 = grecaptcha.getResponse();
      if (captchaResponse3 !== '') {
        clearInterval(checkCaptcha);
        ipcRenderer.send('send-captcha-token', { captchaResponse: captchaResponse3, id: tokenID });
      }
    });
  } else if (captchaResponse !== '') {
    clearInterval(checkCaptcha);
    ipcRenderer.send('send-captcha-token', { captchaResponse: captchaResponse, id: tokenID });
  } else {
    let captchaResponse2 = document.querySelector('#recaptcha-token').value;
    if (captchaResponse2 !== '' && captchaResponse2 !== null) {
      clearInterval(checkCaptcha);
      ipcRenderer.send('send-captcha-token', { captchaResponse: captchaResponse, id: tokenID });
    }
  }
};

if (!window.location.href.includes('google.com')) {
  setInterval(checkCaptcha, 500);
}
// ipcMain.on('send-captcha-token', (event, arg) => {
//   clearInterval(captchaChecker);
// });
