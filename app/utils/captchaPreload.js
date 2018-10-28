const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote;
let captchaChecker = null;

let isRecaptchaFrame = () => {
  return /https:\/\/www.google.com\/recaptcha\/api2\/anchor/.test(window.location.href);
};

window.onload = () => {
  document.querySelector('body').style.height = '200px';
  document.querySelector('html').style.visibility = 'hidden';
  document.querySelector('.g-recaptcha').style.visibility = 'visible';
  document.querySelector('.g-recaptcha').style.position = 'fixed';
  document.querySelector('.g-recaptcha').style.top = '10px';
  document.querySelector('.g-recaptcha').style.marginTop = '0px';
};

checkCaptcha = () => {
  console.log('Checking For Captcha');
  // console.log(isRecaptchaFrame());

  const tokenID = remote.getGlobal('captcaTokenID');
  try {
    document.getElementsByClassName('recaptcha-checkbox-checkmark')[0].click();
    document.getElementsByClassName('recaptcha-checkbox')[0].click();
    document.getElementsByClassName('rc-anchor-center-item rc-anchor-checkbox-holder')[0].click();
  } catch (e) {}
  let captchaResponse;
  let invisibleCaptcha;
  try {
    captchaResponse = grecaptcha.getResponse();
  } catch (e) {}
  try {
    invisibleCaptcha = document.querySelector('.g-recaptcha').getAttribute('data-size');
  } catch (e) {}

  if (invisibleCaptcha === 'invisible' && invisibleCaptcha !== undefined) {
    grecaptcha.execute().then(() => {
      const captchaResponse3 = grecaptcha.getResponse();
      if (captchaResponse3 !== '') {
        clearInterval(captchaChecker);
        ipcRenderer.send('send-captcha-token', { captchaResponse: captchaResponse3, id: tokenID, supremeAuthToken: getSupremeAuthToken() });
        console.log(tokenID);
      }
    });
  } else if (captchaResponse !== '' && captchaResponse !== undefined) {
    clearInterval(captchaChecker);
    ipcRenderer.send('send-captcha-token', { captchaResponse: captchaResponse, id: tokenID, supremeAuthToken: getSupremeAuthToken() });
    console.log(tokenID);
  } else {
    let captchaResponse2 = document.querySelector('#recaptcha-token').value;
    if (captchaResponse2 !== '' && captchaResponse2 !== null) {
      clearInterval(captchaChecker);
      ipcRenderer.send('send-captcha-token', { captchaResponse: captchaResponse, id: tokenID, supremeAuthToken: getSupremeAuthToken() });
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
