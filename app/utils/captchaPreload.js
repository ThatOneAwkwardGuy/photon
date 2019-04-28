const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote;
import { Plugin, passChomeTest } from '../utils/stealth';
let captchaChecker = null;
let authToken;
let oldCookies;
let pookyCookies = '';

const plugins = new Plugin();
plugins.mockPluginsAndMimeTypes();
passChomeTest(window);

const getSupremeAuthToken = () => {
  authToken = document.querySelector('input[name=authenticity_token]').value;
  return authToken;
};

const pressChar = (input, string) => {
  try {
    var changeEvent = new Event('input', {
      bubbles: true,
      cancelable: true
    });
    string.split('').forEach((elem, index, array) => {
      input.value = array.slice(index).join('');
      input.dispatchEvent(pressEvent);
    });
  } catch (e) {}
};

const spoofPookyActions = document => {
  setTimeout(() => {
    var mouseMoveEvent = document.createEvent('MouseEvents');
    mouseMoveEvent.initMouseEvent('mousemove', undefined || !0, !0 || !1, window, 0, 216, 178, 201, 163, !1, !1, !1, !1, 0, null);
    document.querySelector('body').dispatchEvent(mouseMoveEvent);
  }, 0);
  setTimeout(() => {
    var mouseMoveEvent = document.createEvent('MouseEvents');
    mouseMoveEvent.initMouseEvent('mousemove', undefined || !0, !0 || !1, window, 0, 215, 178, 200, 163, !1, !1, !1, !1, 0, null);
    document.querySelector('body').dispatchEvent(mouseMoveEvent);
  }, 9);
  setTimeout(() => {
    var mouseMoveEvent = document.createEvent('MouseEvents');
    mouseMoveEvent.initMouseEvent('mousemove', undefined || !0, !0 || !1, window, 0, 213, 177, 198, 162, !1, !1, !1, !1, 0, null);
    document.querySelector('body').dispatchEvent(mouseMoveEvent);
  }, 26);
  setTimeout(() => {
    var mouseMoveEvent = document.createEvent('MouseEvents');
    mouseMoveEvent.initMouseEvent('mousemove', undefined || !0, !0 || !1, window, 0, 212, 176, 197, 161, !1, !1, !1, !1, 0, null);
    document.querySelector('body').dispatchEvent(mouseMoveEvent);
  }, 43);
  setTimeout(() => {
    var mouseMoveEvent = document.createEvent('MouseEvents');
    mouseMoveEvent.initMouseEvent('mousemove', undefined || !0, !0 || !1, window, 0, 210, 173, 195, 158, !1, !1, !1, !1, 0, null);
    document.querySelector('body').dispatchEvent(mouseMoveEvent);
  }, 59);
  setTimeout(() => {
    var mouseMoveEvent = document.createEvent('MouseEvents');
    mouseMoveEvent.initMouseEvent('mousemove', undefined || !0, !0 || !1, window, 0, 208, 165, 193, 150, !1, !1, !1, !1, 0, null);
    document.querySelector('body').dispatchEvent(mouseMoveEvent);
  }, 77);
  setTimeout(() => {
    var mouseMoveEvent = document.createEvent('MouseEvents');
    mouseMoveEvent.initMouseEvent('mousemove', undefined || !0, !0 || !1, window, 0, 208, 157, 193, 142, !1, !1, !1, !1, 0, null);
    document.querySelector('body').dispatchEvent(mouseMoveEvent);
  }, 92);
  setTimeout(() => {
    var mouseMoveEvent = document.createEvent('MouseEvents');
    mouseMoveEvent.initMouseEvent('mousemove', undefined || !0, !0 || !1, window, 0, 209, 148, 194, 133, !1, !1, !1, !1, 0, null);
    document.querySelector('body').dispatchEvent(mouseMoveEvent);
  }, 109);
  setTimeout(() => {
    var mouseMoveEvent = document.createEvent('MouseEvents');
    mouseMoveEvent.initMouseEvent('mousemove', undefined || !0, !0 || !1, window, 0, 216, 139, 201, 124, !1, !1, !1, !1, 0, null);
    document.querySelector('body').dispatchEvent(mouseMoveEvent);
  }, 126);
  setTimeout(() => {
    var mouseMoveEvent = document.createEvent('MouseEvents');
    mouseMoveEvent.initMouseEvent('mousemove', undefined || !0, !0 || !1, window, 0, 227, 131, 212, 116, !1, !1, !1, !1, 0, null);
    document.querySelector('body').dispatchEvent(mouseMoveEvent);
  }, 143);
  setTimeout(() => {
    var mouseMoveEvent = document.createEvent('MouseEvents');
    mouseMoveEvent.initMouseEvent('mousemove', undefined || !0, !0 || !1, window, 0, 247, 123, 232, 108, !1, !1, !1, !1, 0, null);
    document.querySelector('body').dispatchEvent(mouseMoveEvent);
  }, 159);
  setTimeout(() => {
    var mouseMoveEvent = document.createEvent('MouseEvents');
    mouseMoveEvent.initMouseEvent('mousemove', undefined || !0, !0 || !1, window, 0, 312, 108, 297, 93, !1, !1, !1, !1, 0, null);
    document.querySelector('body').dispatchEvent(mouseMoveEvent);
  }, 192);
  setTimeout(() => {
    var mouseMoveEvent = document.createEvent('MouseEvents');
    mouseMoveEvent.initMouseEvent('mousemove', undefined || !0, !0 || !1, window, 0, 355, 107, 340, 92, !1, !1, !1, !1, 0, null);
    document.querySelector('body').dispatchEvent(mouseMoveEvent);
  }, 209);
  setTimeout(() => {
    var mouseMoveEvent = document.createEvent('MouseEvents');
    mouseMoveEvent.initMouseEvent('mousemove', undefined || !0, !0 || !1, window, 0, 399, 110, 384, 95, !1, !1, !1, !1, 0, null);
    document.querySelector('body').dispatchEvent(mouseMoveEvent);
  }, 226);
  setTimeout(() => {
    var mouseMoveEvent = document.createEvent('MouseEvents');
    mouseMoveEvent.initMouseEvent('mousemove', undefined || !0, !0 || !1, window, 0, 481, 132, 466, 117, !1, !1, !1, !1, 0, null);
    document.querySelector('body').dispatchEvent(mouseMoveEvent);
  }, 240);
  let supremeCheckoutForm = document.querySelectorAll('form input');
  let userInfo = remote.getGlobal('captcaTokenID');
  supremeCheckoutForm.forEach(input => {
    if (input.id === 'order_billing_name') {
      pressChar(document.getElementById(input.id), `${userInfo.profile.billingFirstName} ${userInfo.profile.billingLastName}`);
    } else if (input.id === 'order_email') {
      pressChar(document.getElementById(input.id), userInfo.profile.paymentEmail);
    } else if (input.id === 'bo') {
      pressChar(document.getElementById(input.id), userInfo.profile.deliveryAddress);
    }
  });
};

const checkCaptcha = () => {
  if (window.location.href.includes('supremenewyork.com')) {
    // spoofPookyActions(document);
  }
  if (
    document.location.href.includes('stock_problems') ||
    document.location.href.includes('chrome-error') ||
    document.location.href.includes('https://www.supremenewyork.com/shop')
  ) {
    ipcRenderer.send('send-captcha-token', { checkoutURL: document.location.href, captchaResponse: '', id: '', supremeAuthToken: '', cookies: '' });
  }
  const tokenID = remote.getGlobal('captcaTokenID').id;

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
          cookies: `${document.cookie};${pookyCookies}`,
          oldCookies2: oldCookies
        });
      }
    });
  } else if (captchaResponse !== '' && captchaResponse !== undefined) {
    clearInterval(captchaChecker);
    ipcRenderer.send('send-captcha-token', {
      checkoutURL: document.location.href,
      captchaResponse: captchaResponse,
      id: tokenID,
      supremeAuthToken: authToken,
      cookies: `${document.cookie};${pookyCookies}`,
      oldCookies2: oldCookies
    });
  }
};

const autoFill = () => {};

if (window.location.href.includes('supremenewyork.com')) {
  document.addEventListener('DOMContentLoaded', function() {
    oldCookies = JSON.stringify({ text: document.cookie });
    const siteKey = document.querySelector('.g-recaptcha').getAttribute('data-sitekey');
    authToken = document.querySelector('input[name=authenticity_token]').value;
    document.documentElement.innerHTML = `<html>
<head>
<title>Captcha Harvester</title>
<script type="text/javascript" src="https://www.google.com/recaptcha/api.js?render=explicit"></script>
</head> 
<body>
<iframe id="supremeCartIframe" style="" src="https://www.supremenewyork.com/shop/cart" sandbox="allow-same-origin allow-scripts"></iframe>
<div id="example1" class="g-recaptcha" data-sitekey="${siteKey}" data-callback="sub" data-size="invisible">
</div>
</body>
</html>`;

    function createElementFromHTML(htmlString) {
      var div = document.createElement('div');
      div.innerHTML = htmlString.trim();
      return div.firstChild;
    }
    var ifrm = document.getElementById('supremeCartIframe');
    ifrm.addEventListener('load', function() {
      ifrm.contentWindow.document.querySelector('a.button.checkout').click();
      ifrm.addEventListener('load', function() {
        ifrm.contentWindow.document.documentElement.innerHTML = '';
        captchaChecker = setInterval(checkCaptcha, 300);
      });
    });

    ifrm.contentWindow.document.querySelector('a.button.checkout').click();
  });
} else if (!document.location.href.includes('google.com') && !document.location.href.includes('youtube.com')) {
  document.addEventListener('DOMContentLoaded', function() {
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

// if (!window.location.href.includes('google.com') && !window.location.href.includes('youtube.com')) {
//   // captchaChecker = setInterval(checkCaptcha, 300);
// }

ipcRenderer.on('send-captcha-token', (event, arg) => {
  clearInterval(captchaChecker);
});
