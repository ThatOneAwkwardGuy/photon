const remote = require('electron').remote;
const log = require('electron-log');
import { Plugin, passChomeTest } from '../utils/stealth';
const windowManager = remote.require('electron-window-manager');
const currentWindow = windowManager.getCurrent();
const data = windowManager.sharedData.fetch(currentWindow.name);

import countryCodes from '../store/countryCodes';
import states from '../store/states';
import { webviewTag } from 'electron';
try {
  const plugins = new Plugin();
  plugins.mockPluginsAndMimeTypes();
  passChomeTest(window);
} catch (error) {
  console.log(error);
}

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
  // let supremeCheckoutForm = document.querySelectorAll('form input');
  // let userInfo = remote.getGlobal('captcaTokenID');
  // supremeCheckoutForm.forEach(input => {
  //   if (input.id === 'order_billing_name') {
  //     pressChar(document.getElementById(input.id), `${userInfo.profile.billingFirstName} ${userInfo.profile.billingLastName}`);
  //   } else if (input.id === 'order_email') {
  //     pressChar(document.getElementById(input.id), userInfo.profile.paymentEmail);
  //   } else if (input.id === 'bo') {
  //     pressChar(document.getElementById(input.id), userInfo.profile.deliveryAddress);
  //   }
  // });
};
const sleep = async ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const getCardType = number => {
  var re = new RegExp('^4');
  if (number.match(re) != null) return 'visa';
  if (/^(5[1-5][0-9]{14}|2(22[1-9][0-9]{12}|2[3-9][0-9]{13}|[3-6][0-9]{14}|7[0-1][0-9]{13}|720[0-9]{12}))$/.test(number)) return 'master';
  re = new RegExp('^3[47]');
  if (number.match(re) != null) return 'american_express';
  re = new RegExp('^(6011|622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[0-1][0-9]|92[0-5]|64[4-9])|65)');
  return '';
};

const string_chop = (str, size) => {
  if (str == null) return [];
  str = String(str);
  size = ~~size;
  return size > 0 ? str.match(new RegExp('.{1,' + size + '}', 'g')) : [str];
};

const fillOutFormAndCheckout = async () => {
  let event = document.createEvent('Event');
  event.initEvent('change', true, true);
  try {
    const input = document.querySelector('input[name="order[billing_name]"]');
    input.focus();
    input.value = `${data.profile.billingFirstName} ${data.profile.billingLastName}`;
    await sleep(50);
  } catch (error) {
    console.log(error);
  }
  try {
    const input = document.querySelector('input[name="order[email]"]');
    input.focus();
    input.value = data.profile.paymentEmail;
    pressChar(input, data.profile.paymentEmail);
    await sleep(50);
  } catch (error) {
    console.log(error);
  }
  try {
    const input = document.querySelector('input[name="order[tel]"]');
    input.focus();
    input.value = data.profile.phoneNumber;
    pressChar(input, data.profile.phoneNumber);
    await sleep(50);
  } catch (error) {
    console.log(error);
  }
  try {
    const input = document.querySelector('input[name="order[billing_address]"]');
    input.focus();
    input.value = data.profile.billingAddress;
    pressChar(input, data.profile.billingAddress);
    await sleep(50);
  } catch (error) {
    console.log(error);
  }
  try {
    const input = document.querySelector('input[name="order[billing_address_2]"]');
    input.focus();
    input.value = '';
    pressChar(input, '');
    await sleep(50);
  } catch (error) {
    console.log(error);
  }
  try {
    const input = document.querySelector('input[name="order[billing_address_3]"]');
    input.focus();
    input.value = data.profile.billingAptorSuite;
    pressChar(input, data.profile.billingAptorSuite);
    await sleep(50);
  } catch (error) {
    console.log(error);
  }
  try {
    const input = document.querySelector('input[name="order[billing_city]"]');
    input.focus();
    input.value = data.profile.billingCity;
    pressChar(input, data.profile.billingCity);
    await sleep(50);
  } catch (error) {
    console.log(error);
  }
  try {
    const input = document.querySelector('input[name="order[billing_zip]"]');
    input.focus();
    input.value = data.profile.billingZip;
    pressChar(input, data.profile.billingZip);
    await sleep(50);
  } catch (error) {
    console.log(error);
  }
  try {
    const input = document.querySelector('select[name="order[billing_country]"]');
    input.focus();
    const billingCountry =
      data.profile.billingCountry === 'United States' ? 'USA' : data.profile.billingCountry === 'Canada' ? 'CANADA' : countryCodes[data.profile.billingCountry];
    input.value = billingCountry;
    input.dispatchEvent(event);
    await sleep(50);
  } catch (error) {
    console.log(error);
  }
  try {
    const input = document.querySelector('input[name="same_as_billing_address"]');
    input.focus();
    input.value = '1';
    pressChar(input, '1');
    await sleep(50);
  } catch (error) {
    console.log(error);
  }
  try {
    const input = document.querySelector('input[name="store_credit_id"]');
    input.focus();
    input.value = '';
    pressChar(input, '');
    await sleep(50);
  } catch (error) {
    console.log(error);
  }
  try {
    const input = document.querySelector('select[name="credit_card[type]"]');
    input.focus();
    input.value = getCardType(data.profile.paymentCardnumber);
    pressChar(input, getCardType(data.profile.paymentCardnumber));
    input.dispatchEvent(event);
    await sleep(50);
  } catch (error) {
    console.log(error);
  }
  try {
    const input = document.querySelector('input[name="credit_card[cnb]"]');
    input.focus();
    input.value = string_chop(data.profile.paymentCardnumber, 4).join(' ');
    pressChar(input, string_chop(data.profile.paymentCardnumber, 4).join(' '));
    input.dispatchEvent(event);
    await sleep(50);
  } catch (error) {
    console.log(error);
  }

  try {
    const input = document.querySelector('input[name="credit_card[nlb]"]');
    input.focus();
    input.value = string_chop(data.profile.paymentCardnumber, 4).join(' ');
    pressChar(input, string_chop(data.profile.paymentCardnumber, 4).join(' '));
    await sleep(50);
  } catch (error) {
    console.log(error);
  }

  try {
    const input = document.querySelector('select[name="credit_card[month]"]');
    input.focus();
    input.value = data.profile.paymentCardExpiryMonth;
    pressChar(input, data.profile.paymentCardExpiryMonth);
    input.dispatchEvent(event);
    await sleep(50);
  } catch (error) {
    console.log(error);
  }
  try {
    const input = document.querySelector('select[name="credit_card[year]"]');
    input.focus();
    input.value = data.profile.paymentCardExpiryYear;
    pressChar(input, data.profile.paymentCardExpiryYear);
    input.dispatchEvent(event);
    await sleep(50);
  } catch (error) {
    console.log(error);
  }
  try {
    const input = document.querySelector('input[name="credit_card[vval]"]');
    input.focus();
    input.value = data.profile.paymentCVV;
    pressChar(input, '');
    await sleep(50);
  } catch (error) {
    console.log(error);
  }

  try {
    const input = document.querySelector('input[name="credit_card[rvv]"]');
    input.focus();
    input.value = data.profile.paymentCVV;
    pressChar(input, '');
    await sleep(50);
  } catch (error) {
    console.log(error);
  }

  try {
    const input = document.querySelector('input[name="order[billing_state]"]');
    input.focus();
    input.value = states[data.profile.billingProvince];
    pressChar(input, '');
    input.dispatchEvent(event);
    await sleep(50);
  } catch (error) {
    console.log(error);
  }

  try {
    const input = document.querySelector('input[name="order[terms]"]');
    input.focus();
    input.value = '1';
    await sleep(50);
  } catch (error) {
    console.log(error);
  }

  try {
    const input = document.querySelector('input[name="order[terms]"]');
    input.focus();
    input.click();
    input.checked = true;
  } catch (error) {
    console.log(error);
  }

  // try {
  //   await sleep(50);
  //   document.getElementById('hidden_cursor_capture').click();
  // } catch (error) {
  //   console.log(error);
  // }

  try {
    if (data.task.checkoutDelay !== '') {
      await sleep(data.task.checkoutDelay);
    }
    document.querySelector('#submit_button').click();
  } catch (error) {
    console.log(error);
  }
  // try {
  //   document.querySelector('#checkout_form').submit();
  // } catch (error) {
  //   console.log(error);
  // }
};

const clickCheckoutButton = async () => {
  document.querySelector('#checkout-now').click();
  log.info(`[Task - ${data.index + 1}] - Clicked Supreme Checkout`);
};

const addItemToCart = async () => {
  document.querySelector('#size-options').value = data.sizeID;
  await sleep(50);
  document.querySelector('span.cart-button').click();
  var observer2 = new MutationObserver(function(mutations, me) {
    var canvas = document.querySelector('#checkout-now');
    if (canvas) {
      clickCheckoutButton();
      me.disconnect();
      return;
    }
  });
  observer2.observe(document, {
    childList: true,
    subtree: true
  });
};

window.addEventListener('load', async () => {
  var observer1 = new MutationObserver(function(mutations, me) {
    var canvas = document.querySelector('#size-options');
    if (canvas) {
      addItemToCart();
      me.disconnect();
      return;
    }
  });
  observer1.observe(document, {
    childList: true,
    subtree: true
  });

  var observer3 = new MutationObserver(function(mutations, me) {
    var canvas = document.querySelector('input[name="order[billing_name]"]');
    if (canvas) {
      fillOutFormAndCheckout();
      me.disconnect();
      return;
    }
  });
  observer3.observe(document, {
    childList: true,
    subtree: true
  });

  // if (process.env.NODE_ENV === 'development') {
  //   document.querySelector('webview').openDevTools();
  // }
  // ifrm.contentWindow.document.querySelector('a.button.checkout').click();
  // try {
  //   spoofPookyActions(document);
  // } catch (error) {
  //   console.log(error);
  // }
});
