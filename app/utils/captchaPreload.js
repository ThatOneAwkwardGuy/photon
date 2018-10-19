const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote;
let captchaChecker = null;

checkCaptcha = () => {
  console.log('Checking For Captcha');
  const tokenID = remote.getGlobal('captcaTokenID');
  let captchaResponse = grecaptcha.getResponse();
  let invisibleCaptcha = document.querySelector('.g-recaptcha').getAttribute('data-size');
  if (invisibleCaptcha === 'invisible') {
    grecaptcha.execute().then(() => {
      const captchaResponse3 = grecaptcha.getResponse();
      if (captchaResponse3 !== '') {
        ipcRenderer.send('send-captcha-token', { captchaResponse: captchaResponse3, id: tokenID, supremeAuthToken: getSupremeAuthToken() });
        clearInterval(captchaChecker);
        console.log(tokenID);
      }
    });
  } else if (captchaResponse !== '') {
    ipcRenderer.send('send-captcha-token', { captchaResponse: captchaResponse, id: tokenID, supremeAuthToken: getSupremeAuthToken() });
    clearInterval(captchaChecker);
    console.log(tokenID);
  } else {
    let captchaResponse2 = document.querySelector('#recaptcha-token').value;
    if (captchaResponse2 !== '' && captchaResponse2 !== null) {
      ipcRenderer.send('send-captcha-token', { captchaResponse: captchaResponse, id: tokenID, supremeAuthToken: getSupremeAuthToken() });
      clearInterval(captchaChecker);
      console.log(tokenID);
    }
  }
};

getSupremeAuthToken = () => {
  const authToken = document.querySelector('input[name=authenticity_token]').value;
  return authToken;
};

if (!window.location.href.includes('google.com')) {
  captchaChecker = setInterval(checkCaptcha, 500);
}
// ipcMain.on('send-captcha-token', (event, arg) => {
//   clearInterval(captchaChecker);
// });
