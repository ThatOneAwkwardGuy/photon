import stores from '../store/shops';
import captchaNeeded from '../store/captcha';
import { undefeatedAccountLogin } from './helpers';
const request = require('request-promise');
const cheerio = require('cheerio');
const moment = require('moment');
var tough = require('tough-cookie');
const ipcRenderer = require('electron').ipcRenderer;
import { BOT_SEND_COOKIES_AND_CAPTCHA_PAGE, OPEN_CAPTCHA_WINDOW, RECEIVE_CAPTCHA_TOKEN } from '../utils/constants';
export default class Shopify {
  constructor(options, handleChangeStatus, proxy, stop) {
    this.options = options;
    this.handleChangeStatus = handleChangeStatus;
    this.proxy = proxy;
    this.stop = stop;
    this.cookieJar = request.jar();
    this.rp = request.defaults({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
        Cookie: this.cookieJar.getCookieString(stores[this.options.task.store])
      },
      jar: this.cookieJar,
      proxy: this.options.task.proxy === '' ? (this.proxy !== undefined ? `http://${this.proxy.user}:${this.proxy.pass}@${this.proxy.ip}:${this.proxy.port}` : '') : `http://${this.options.task.proxy}`
    });
  }

  returnDomainFromURL(urlstring) {
    const domainArray = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n]+)/im.exec(urlstring);
    return domainArray[1];
  }

  addToCart = async (variantID, amount) => {
    const payload = {
      id: variantID,
      quantity: amount
    };
    const response = await this.rp({
      method: 'POST',
      uri: `${stores[this.options.task.store]}/cart/add.js`,
      form: payload
    });
  };

  generatePaymentToken = async () => {
    const payload = {
      credit_card: {
        number: this.options.profile.paymentCardnumber,
        name: this.options.profile.paymentCardholdersName,
        month: this.options.profile.paymentCardExpiryMonth,
        year: this.options.profile.paymentCardExpiryYear,
        verification_value: this.options.profile.paymentCVV
      }
    };
    const response = await this.rp({
      method: 'POST',
      uri: 'https://elb.deposit.shopifycs.com/sessions',
      body: payload,
      json: true
    });
    return response.id;
  };

  getCheckoutBody = async checkoutURL => {
    const response = await this.rp({
      method: 'GET',
      uri: `${checkoutURL}?step=payment_method`,
      resolveWithFullResponse: true
    });
    // response.headers['set-cookie'].forEach(cookie => {
    //   if (cookie.includes('_shopify_s')) {
    //     const replacedCookie = cookie.replace('_shopify_s', '_s');
    //     const splitCookie = replacedCookie.split(';');
    //     this.cookieJar.setCookie(splitCookie[0], stores[this.options.task.store]);
    //   } else if (cookie.includes('_shopify_y')) {
    //     const replacedCookie = cookie.replace('_shopify_y', '_y');
    //     const splitCookie = replacedCookie.split(';');
    //     this.cookieJar.setCookie(splitCookie[0], stores[this.options.task.store]);
    //   }
    // });
    // this.cookieJar.setCookie('_shopify_fs=2018-10-12T17%3A56%3A06.398Z', stores[this.options.task.store]);
    // this.cookieJar.setCookie('_shopify_sa_t=2018-10-12T17%3A56%3A06.411Z', stores[this.options.task.store]);

    // if (cookie.includes('_shopify_s')) {
    //   const splitCookie = cookie.split(/[\s,;=]+/);
    //   let newCookie = new tough.Cookie({
    //     key: '_s',
    //     value: splitCookie[1],
    //     domain: stores[this.options.task.store].slice(8)
    //   });
    //   this.cookieJar.setCookie(newCookie, stores[this.options.task.store]);
    // } else if (cookie.includes('_shopify_y')) {
    //   const splitCookie = cookie.split(/[\s,;=]+/);
    //   let newCookie = new tough.Cookie({
    //     key: '_y',
    //     value: splitCookie[1],
    //     domain: stores[this.options.task.store].slice(8)
    //   });
    //   this.cookieJar.setCookie(newCookie, stores[this.options.task.store]);
    // }
    // });
    return response.body;
  };

  getCheckoutUrl = async () => {
    try {
      const response = await this.rp({
        method: 'GET',
        uri: `${stores[this.options.task.store]}/checkout.js`,
        resolveWithFullResponse: true,
        followAllRedirects: true
      });
      const $ = cheerio.load(response.body);
      // console.log(response.body);
      // console.log($('#g-recaptcha iframe').attr('src'));

      return response.request.href;
    } catch (e) {
      console.error(e);
    }
  };

  sendCustomerInfo = async (checkoutURL, authToken, captchaToken) => {
    const payload = {
      utf8: '✓',
      _method: 'patch',
      authenticity_token: authToken !== undefined ? authToken : '',
      previous_step: 'contact_information',
      step: 'shipping_method',
      'checkout[email]': `${this.options.profile.paymentEmail}`,
      'checkout[buyer_accepts_marketing]': '0',
      'checkout[shipping_address][first_name]': `${this.options.profile.deliveryFirstName}`,
      'checkout[shipping_address][last_name]': `${this.options.profile.deliveryLastName}`,
      'checkout[shipping_address][company]': '',
      'checkout[shipping_address][address1]': `${this.options.profile.deliveryAddress}`,
      'checkout[shipping_address][address2]': `${this.options.profile.deliveryAptorSuite}`,
      'checkout[shipping_address][city]': `${this.options.profile.deliveryCity}`,
      'checkout[shipping_address][country]': `${this.options.profile.deliveryCountry}`,
      'checkout[shipping_address][province]': `${this.options.profile.deliveryProvince}`,
      'checkout[shipping_address][zip]': `${this.options.profile.deliveryZip}`,
      'checkout[shipping_address][phone]': `${this.options.profile.phoneNumber}`,
      'checkout[remember_me]': '0',
      'checkout[client_details][browser_width]': '1710',
      'checkout[client_details][browser_height]': '1289',
      'checkout[client_details][javascript_enabled]': '1',
      button: ''
    };
    if (captchaToken !== undefined) {
      payload['g-recaptcha-response'] = captchaToken;
    }
    // console.log(checkoutURL);
    // console.log(payload);
    // this.cookieJar.setCookie('_shopify_sa_p=', stores[this.options.task.store]);
    // this.cookieJar.setCookie('__olAlertsForShop=[]', stores[this.options.task.store]);
    // this.cookieJar.setCookie('hide_shopify_pay_for_checkout=false', stores[this.options.task.store]);
    // this.cookieJar.setCookie('shopify_pay_redirect=false', stores[this.options.task.store]);
    // this.cookieJar.setCookie('sig-shopify=true', stores[this.options.task.store]);

    const response = await this.rp({
      method: 'POST',
      uri: checkoutURL,
      followAllRedirects: true,
      resolveWithFullResponse: true,
      form: payload
    });
    return response;
  };

  returnPaymentID = paymentBody => {
    const $ = cheerio.load(paymentBody);
    return $('div.section.section--payment-method input').attr('value');
  };

  returnAuthToken = paymentBody => {
    const $ = cheerio.load(paymentBody);
    return $('input[name="authenticity_token"]').attr('value');
  };

  returnOrderTotal = paymentBody => {
    const $ = cheerio.load(paymentBody);
    return $('span[data-checkout-subtotal-price-target]')['0'].attribs['data-checkout-subtotal-price-target'];
  };

  returnBodyInfo = body => {
    const $ = cheerio.load(body);
    return {
      paymentID: $('div.section.section--payment-method input').attr('value'),
      authToken: $('input[name="authenticity_token"]').attr('value'),
      orderTotal: $('span[data-checkout-subtotal-price-target]')['0'].attribs['data-checkout-subtotal-price-target']
    };
  };

  getShippingToken = async () => {
    const payload = {
      shipping_address: {
        zip: this.options.profile.deliveryZip,
        country: this.options.profile.deliveryCountry,
        province: this.options.profile.deliveryProvince
      }
    };
    const response = await this.rp({
      method: 'POST',
      json: true,
      uri: `${stores[this.options.task.store]}/cart/shipping_rates.json`,
      body: payload
    });
    for (const shippingRates of response.shipping_rates) {
      if (!shippingRates.name.toLowerCase().includes('collection') && !shippingRates.name.toLowerCase().includes('pick')) {
        const shipOpt = shippingRates.name.replace(/ /g, '%20');
        const shipPrc = shippingRates.price;
        const shipSource = shippingRates.source;
        const shipCode = shippingRates.code;
        const shippingOption = `${shipSource}-${shipCode}-${shipPrc}`;
        const shippingInfo = {
          token: shippingOption,
          price: shipPrc
        };
        return shippingInfo;
      }
    }
  };

  sendShippingMethod = async (shippingToken, checkoutURL, authToken) => {
    const payload = {
      utf8: '✓',
      _method: 'patch',
      authenticity_token: `${authToken}`,
      previous_step: 'shipping_method',
      step: 'payment_method',
      'checkout[shipping_rate][id]': `${encodeURIComponent(shippingToken)}`,
      button: '',
      'checkout[client_details][browser_width]': '1710',
      'checkout[client_details][browser_height]': '1289',
      'checkout[client_details][javascript_enabled]': '1'
    };
    const response = await this.rp({
      method: 'POST',
      uri: checkoutURL,
      followAllRedirects: true,
      resolveWithFullResponse: true,
      form: payload
    });
    return response;
  };

  sendCheckoutInfo = async (paymentToken, shippingToken, shippingPrice, paymentID, authToken, checkoutURL, orderTotal) => {
    const payload = {
      utf8: '✓',
      _method: 'patch',
      authenticity_token: `${authToken}`,
      previous_step: 'payment_method',
      step: '',
      s: `${paymentToken}`,
      'checkout[payment_gateway]': `${paymentID}`,
      'checkout[credit_card][vault]': 'false',
      'checkout[different_billing_address]': 'true',
      'checkout[billing_address][first_name]': `${this.options.profile.billingFirstName}`,
      'checkout[billing_address][last_name]': `${this.options.profile.billingLastName}`,
      'checkout[billing_address][address1]': `${this.options.profile.billingAddress}`,
      'checkout[billing_address][address2]': `${this.options.profile.billingAptorSuite}`,
      'checkout[billing_address][city]': `${this.options.profile.billingCity}`,
      'checkout[billing_address][country]': `${this.options.profile.billingCountry}`,
      'checkout[billing_address][province]': `${this.options.profile.billingProvince}`,
      'checkout[billing_address][zip]': `${this.options.profile.billingZip}`,
      'checkout[billing_address][phone]': `${this.options.profile.phoneNumber}`,
      complete: '1',
      'checkout[client_details][browser_width]': Math.floor(Math.random() * 2000) + 1000,
      'checkout[client_details][browser_height]': Math.floor(Math.random() * 2000) + 1000,
      'checkout[client_details][javascript_enabled]': '1',
      'checkout[total_price]': `${parseInt(orderTotal) + shippingPrice * 100}`
    };
    const response = await this.rp({
      method: 'POST',
      uri: checkoutURL,
      form: payload,
      resolveWithFullResponse: true,
      followAllRedirects: true
    });
    return response;
  };

  getHomepage = async () => {
    const response = await this.rp({
      method: 'GET',
      json: true,
      uri: `${stores[this.options.task.store]}`
    });
  };

  checkoutWithVariant = async variantID => {
    try {
      console.log(`[${moment().format('HH:mm:ss:SSS')}] - Adding To Cart`);
      await this.addToCart(variantID, this.options.task.quantity);
      console.log(`[${moment().format('HH:mm:ss:SSS')}] - Getting  Shipping and Payment Tokens`);
      const [paymentToken, checkoutURL, shipping] = await Promise.all([this.generatePaymentToken(), this.getCheckoutUrl(), this.getShippingToken()]);
      if (captchaNeeded[this.options.task.store]) {
        ipcRenderer.send(OPEN_CAPTCHA_WINDOW, 'open');
        ipcRenderer.send(BOT_SEND_COOKIES_AND_CAPTCHA_PAGE, {
          cookies: this.cookieJar.getCookieString(checkoutURL),
          checkoutURL: checkoutURL,
          baseURL: stores[this.options.task.store]
        });

        this.handleChangeStatus('Waiting For Captcha');
        ipcRenderer.on(RECEIVE_CAPTCHA_TOKEN, async (event, captchaToken) => {
          console.log(captchaToken);
          this.handleChangeStatus('Checking Out');
          const checkoutBody = await this.getCheckoutBody(checkoutURL);
          const bodyInfo = this.returnBodyInfo(checkoutBody);
          const paymentID = bodyInfo.paymentID;
          const authToken = bodyInfo.authToken;
          const orderTotal = bodyInfo.orderTotal;
          console.log(`[${moment().format('HH:mm:ss:SSS')}] - Sending Customer Info`);
          const sendCustomerInfoResponse = await this.sendCustomerInfo(checkoutURL, authToken, captchaToken.captchaResponse);
          const sendShippingMethodBodyInfo = this.returnBodyInfo(sendCustomerInfoResponse.body);
          console.log(`[${moment().format('HH:mm:ss:SSS')}] - Sending Shipping Info`);
          const sendShippingMethodResponse = await this.sendShippingMethod(shipping.token, checkoutURL, sendShippingMethodBodyInfo.authToken);
          const checkoutBodyInfo = this.returnBodyInfo(sendShippingMethodResponse.body);
          console.log(`[${moment().format('HH:mm:ss:SSS')}] - Finished Checkout`);
          const checkoutResponse = await this.sendCheckoutInfo(paymentToken, shipping.token, shipping.price, paymentID, checkoutBodyInfo.authToken, checkoutURL, orderTotal);
          if (checkoutResponse.body.includes(`<p class="notice__text">The information you provided couldn't be verified. Please check your card details and try again.</p>`)) {
            this.handleChangeStatus('Error Processing Payment');
          } else if (checkoutResponse.body.includes(`Shopify.Checkout.step = "contact_information";`)) {
            this.handleChangeStatus('Stuck On Customer Info Page');
          } else if (checkoutResponse.body.includes(`Shopify.Checkout.step = "shipping_method";`)) {
            this.handleChangeStatus('Stuck On Shipping Method Page');
          } else {
            this.handleChangeStatus('Check Email');
          }
        });
      } else {
        this.handleChangeStatus('Checking Out');
        const checkoutBody = await this.getCheckoutBody(checkoutURL);
        const bodyInfo = this.returnBodyInfo(checkoutBody);
        const paymentID = bodyInfo.paymentID;
        const authToken = bodyInfo.authToken;
        const orderTotal = bodyInfo.orderTotal;
        console.log(`[${moment().format('HH:mm:ss:SSS')}] - Sending Customer Info`);
        const sendCustomerInfoResponse = await this.sendCustomerInfo(checkoutURL, authToken);
        const sendShippingMethodBodyInfo = this.returnBodyInfo(sendCustomerInfoResponse.body);
        console.log(`[${moment().format('HH:mm:ss:SSS')}] - Sending Shipping Info`);
        const sendShippingMethodResponse = await this.sendShippingMethod(shipping.token, checkoutURL, sendShippingMethodBodyInfo.authToken);
        const checkoutBodyInfo = this.returnBodyInfo(sendShippingMethodResponse.body);
        console.log(`[${moment().format('HH:mm:ss:SSS')}] - Finished Checkout`);
        const checkoutResponse = await this.sendCheckoutInfo(paymentToken, shipping.token, shipping.price, paymentID, checkoutBodyInfo.authToken, checkoutURL, orderTotal);
        if (checkoutResponse.body.includes(`<p class="notice__text">The information you provided couldn't be verified. Please check your card details and try again.</p>`)) {
          this.handleChangeStatus('Error Processing Payment');
        } else if (checkoutResponse.body.includes(`Shopify.Checkout.step = "contact_information";`)) {
          this.handleChangeStatus('Stuck On Customer Info Page');
        } else if (checkoutResponse.body.includes(`Shopify.Checkout.step = "shipping_method";`)) {
          this.handleChangeStatus('Stuck On Shipping Method Page');
        } else {
          this.handleChangeStatus('Check Email');
        }
      }
      this.stop(true);
    } catch (e) {
      console.log(`[${moment().format('HH:mm:ss:SSS')}] - Finished Checkout - Error`);
      console.log(e);
      if (_.get(e, 'options.uri').includes('stock_problems')) {
        this.handleChangeStatus('Item Out Of Stock');
      } else if (e.message === '422 - {"country":["is not supported"]}') {
        this.handleChangeStatus('Country Is Not Supported');
      } else {
        this.handleChangeStatus(_.get(e, "error.error['0']"));
      }
      // this.stop(false);
    }
  };
}
