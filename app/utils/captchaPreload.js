const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote;
let captchaChecker = null;
let authToken;
console.log(remote.getGlobal('captcaTokenID'));
checkCaptcha = () => {
  // console.log('Checking For Captcha');
  // console.log(isRecaptchaFrame());
  // console.log(document.location.href);
  if (
    document.location.href.includes('stock_problems') ||
    document.location.href.includes('chrome-error') ||
    document.location.href.includes('https://www.supremenewyork.com/shop')
  ) {
    ipcRenderer.send('send-captcha-token', { checkoutURL: document.location.href, captchaResponse: '', id: '', supremeAuthToken: '', cookies: '' });
  }
  const tokenID = remote.getGlobal('captcaTokenID');
  try {
    document.getElementsByClassName('recaptcha-checkbox-checkmark')[0].click();
  } catch (e) {
    try {
      document.getElementsByClassName('recaptcha-checkbox')[0].click();
    } catch (error) {
      // console.log(e);
      try {
        document.getElementsByClassName('rc-anchor-center-item rc-anchor-checkbox-holder')[0].click();
      } catch (error) {}
    }
  }

  let captchaResponse;
  let invisibleCaptcha;

  try {
    invisibleCaptcha = document.querySelector('.g-recaptcha').getAttribute('data-size');
    if (invisibleCaptcha === null) {
      throw new Error();
    }
  } catch (e) {
    try {
      captchaResponse = grecaptcha.getResponse();
      if (captchaResponse === '') {
        throw new Error();
      }
    } catch (e) {
      try {
        captchaResponse = document.getElementById('recaptcha-token').value;
      } catch (e) {}
    }
  }

  // console.log(captchaResponse);

  if (invisibleCaptcha === 'invisible' && invisibleCaptcha !== undefined) {
    grecaptcha.execute().then(() => {
      const captchaResponse3 = grecaptcha.getResponse();
      if (captchaResponse3 !== '') {
        clearInterval(captchaChecker);
        ipcRenderer.send('send-captcha-token', {
          checkoutURL: document.location.href,
          captchaResponse: captchaResponse3,
          id: tokenID,
          supremeAuthToken: authToken,
          cookies: document.cookie
        });
        console.log(tokenID);
      }
    });
  } else if (captchaResponse !== '' && captchaResponse !== undefined) {
    clearInterval(captchaChecker);
    ipcRenderer.send('send-captcha-token', {
      checkoutURL: document.location.href,
      captchaResponse: captchaResponse,
      id: tokenID,
      supremeAuthToken: authToken,
      cookies: document.cookie
    });
    console.log(tokenID);
  }
  // else {
  //   let captchaResponse2 = document.querySelector('#recaptcha-token').value;
  //   if (captchaResponse2 !== '' && captchaResponse2 !== null) {
  //     clearInterval(captchaChecker);
  //     ipcRenderer.send('send-captcha-token', {
  //       checkoutURL: document.location.href,
  //       captchaResponse: captchaResponse,
  //       id: tokenID,
  //       supremeAuthToken: authToken,
  //       cookies: document.cookie
  //     });
  //     console.log(tokenID);
  //   }
  // }
};

getSupremeAuthToken = () => {
  authToken = document.querySelector('input[name=authenticity_token]').value;
  return authToken;
};

if (window.location.href.includes('supremenewyork.com')) {
  console.log('supreme here');
  document.addEventListener('DOMContentLoaded', function() {
    const siteKey = document.querySelector('.g-recaptcha').getAttribute('data-sitekey');
    authToken = document.querySelector('input[name=authenticity_token]').value;
    // const html = document.documentElement.innerHTML;
    document.documentElement.innerHTML = `<html>
<head>
<title>Captcha Harvester</title>
<script type="text/javascript" src="https://www.google.com/recaptcha/api.js?render=explicit"></script>
</head> 
<body>
<div id="example1" class="g-recaptcha" data-sitekey="${siteKey}" data-callback="sub" data-size="invisible">
</div>
</body>
</html>`;
  });
} else if (!document.location.href.includes('google.com') && !document.location.href.includes('youtube.com')) {
  console.log('shopify here');
  document.addEventListener('DOMContentLoaded', function() {
    const body = document.body.innerHTML;
    const bodySiteKey = body.match(/.sitekey: "(.*)"/)[1];
    document.documentElement.innerHTML = `<!DOCTYPE html>
    <html>
    <head>
    <title>Captcha Harvester</title>
    </head> 
    <body>
    <script type="text/javascript" src="https://www.recaptcha.net/recaptcha/api.js?onload=recaptchaCallback&amp;render=${bodySiteKey}&amp;hl=en"></script>
    <script>
    grecaptcha.render('g-recaptcha', {
      sitekey: "${bodySiteKey}",
      size: (window.innerWidth > 320) ? 'normal' : 'compact',
      callback: 'onCaptchaSuccess',
    });
    </script>
    <div id="g-recaptcha" class="g-recaptcha"></div>
    </body>
    </html>`;
  });
}

if (!window.location.href.includes('google.com') && !window.location.href.includes('youtube.com')) {
  captchaChecker = setInterval(checkCaptcha, 150);
}
// window.onload = () => {
//   document.querySelector('body').style.height = '200px';
//   document.querySelector('html').style.visibility = 'hidden';
//   document.querySelector('.g-recaptcha').style.visibility = 'visible';
//   document.querySelector('.g-recaptcha').style.position = 'fixed';
//   document.querySelector('.g-recaptcha').style.top = '10px';
//   document.querySelector('.g-recaptcha').style.marginTop = '0px';
// };

// ipcMain.on('send-captcha-token', (event, arg) => {
//   clearInterval(captchaChecker);
// });
