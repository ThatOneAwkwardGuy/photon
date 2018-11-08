import stores from '../store/shops';
import captchaNeeded from '../store/captcha';
import { undefeatedAccountLogin } from './helpers';
const request = require('request-promise');
const cheerio = require('cheerio');
const moment = require('moment');
var tough = require('tough-cookie');
const uuidv4 = require('uuid/v4');
const ipcRenderer = require('electron').ipcRenderer;
import { BOT_SEND_COOKIES_AND_CAPTCHA_PAGE, OPEN_CAPTCHA_WINDOW, RECEIVE_CAPTCHA_TOKEN } from '../utils/constants';
export default class Shopify {
  constructor(options, handleChangeStatus, proxy, stop, shopifyCheckoutURL, cookieJar, settings, run) {
    this.options = options;
    this.handleChangeStatus = handleChangeStatus;
    this.proxy = proxy;
    this.stop = stop;
    this.settings = settings;
    this.shopifyCheckoutURL = shopifyCheckoutURL;
    this.cookieJar = cookieJar;
    this.tokenID = uuidv4();
    this.run = run;
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

  getQueueBypassCheckoutLink = async () => {
    try {
      const response = await this.rp({
        method: 'GET',
        uri: `${stores[this.options.task.store]}/checkout.js`,
        resolveWithFullResponse: true,
        followRedirect: false,
        followAllRedirects: false
        // maxRedirects: 1
      });
      return response.response.headers.location;
    } catch (e) {
      return e.response.headers.location;
    }
  };

  sleep = ms => {
    console.log(`[${moment().format('HH:mm:ss:SSS')}] - Sleeping For ${ms}ms`);
    return new Promise(resolve => setTimeout(resolve, ms));
  };

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
      resolveWithFullResponse: true,
      followAllRedirects: true,
      followRedirect: true
    });
    return response.body;
  };

  pollQueueOrCheckout = async url => {
    console.log(url);
    if (url.includes('processing')) {
      this.handleChangeStatus('Processing');
    } else if (url.includes('throttle') || url.includes('queue')) {
      this.handleChangeStatus('Waiting In Queue');
    } else if (url.includes('stock_problems' && this.settings.monitorForRestock)) {
      this.handleChangeStatus('Monitoring For Restock');
    }
    try {
      const response = await this.rp({
        method: 'GET',
        uri: url,
        resolveWithFullResponse: true
      });
      if (response.request.href.includes('processing')) {
        await this.pollQueueOrCheckout(response.request.href);
      } else if (response.request.href.includes('validate=true')) {
        const $ = cheerio.load(response.body);
        if (
          response.body.includes(`<p class="notice__text">The information you provided couldn't be verified. Please check your card details and try again.</p>`) ||
          response.body.includes('There was an error processing your payment. Please try again.')
        ) {
          this.handleChangeStatus('Error Processing Payment');
          this.stop(true);
        } else if (response.body.includes(`Shopify.Checkout.step = "contact_information";`)) {
          this.handleChangeStatus('Stuck On Customer Info Page');
          this.stop(true);
        } else if (response.body.includes(`Shopify.Checkout.step = "shipping_method";`)) {
          this.handleChangeStatus('Stuck On Shipping Method Page');
          this.stop(true);
        } else {
          this.handleChangeStatus('Check Email');
          this.stop(true);
        }
      } else if (url.includes('throttle') || url.includes('queue')) {
        await this.pollQueueOrCheckout(response.request.href);
      } else if (url.includes('stock_problems') && this.settings.monitorForRestock) {
        this.handleChangeStatus('Monitoring For Restock');
        await this.sleep(this.settings.monitorTime);
        await this.pollQueueOrCheckout(response.request.href);
      } else if (url.includes('stock_problems') && !this.settings.monitorForRestock) {
        this.handleChangeStatus('Out Of Stock');
      } else {
        this.checkoutWithCheckoutURL(url);
      }
    } catch (e) {
      this.stop(false);
      console.error(e);
    }
  };

  getCheckoutUrl = async () => {
    try {
      const response = await this.rp({
        method: 'GET',
        uri: `${stores[this.options.task.store]}/checkout.js`,
        resolveWithFullResponse: true,
        followAllRedirects: true
      });
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
    if (!stores[this.options.task.store].includes('palace')) {
      payload['checkout[shipping_address][company]'] = '';
    }
    const response = await this.rp({
      method: 'POST',
      uri: checkoutURL,
      followAllRedirects: true,
      resolveWithFullResponse: true,
      form: payload
    });
    console.log(payload);
    console.log(response);
    return response;
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

  sendCheckoutInfo = async (paymentToken, shippingPrice, paymentID, authToken, checkoutURL, orderTotal) => {
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
    console.log(response);
    return response;
  };

  getHomepage = async () => {
    const response = await this.rp({
      method: 'GET',
      json: true,
      uri: `${stores[this.options.task.store]}`
    });
  };

  checkoutWithCheckoutURL = async checkoutURL => {
    if (captchaNeeded[this.options.task.store]) {
      ipcRenderer.send(OPEN_CAPTCHA_WINDOW, 'open');
      console.log(this.cookieJar.getCookieString(checkoutURL));
      ipcRenderer.send(BOT_SEND_COOKIES_AND_CAPTCHA_PAGE, {
        cookies: `${this.cookieJar.getCookieString(checkoutURL)}`,
        checkoutURL: checkoutURL,
        id: this.tokenID,
        proxy: this.proxy,
        baseURL: stores[this.options.task.store]
      });
      this.handleChangeStatus('Waiting For Captcha');
      ipcRenderer.on(RECEIVE_CAPTCHA_TOKEN, async (event, captchaToken) => {
        if (captchaToken.checkoutURL.includes('stock_problems') && this.settings.monitorForRestock) {
          this.handleChangeStatus('Monitoring For Restock');
          await this.pollQueueOrCheckout(captchaToken.checkoutURL);
        } else if (url.includes('stock_problems') && !this.settings.monitorForRestock) {
          this.handleChangeStatus('Out Of Stock');
        } else {
          this.handleChangeStatus('Checking Out');
          const checkoutBody = await this.getCheckoutBody(checkoutURL);
          const bodyInfo = this.returnBodyInfo(checkoutBody);
          const paymentID = bodyInfo.paymentID;
          const authToken = bodyInfo.authToken;
          const orderTotal = bodyInfo.orderTotal;
          console.log(`[${moment().format('HH:mm:ss:SSS')}] - Sending Customer Info`);
          this.handleChangeStatus('Sending Customer Info');
          const sendCustomerInfoResponse = await this.sendCustomerInfo(checkoutURL, authToken, captchaToken.captchaResponse);
          const sendShippingMethodBodyInfo = this.returnBodyInfo(sendCustomerInfoResponse.body);
          console.log(`[${moment().format('HH:mm:ss:SSS')}] - Sending Shipping Info`);
          this.handleChangeStatus('Sending Shipping Info');
          const sendShippingMethodResponse = await this.sendShippingMethod(shipping.token, checkoutURL, sendShippingMethodBodyInfo.authToken);
          const checkoutBodyInfo = this.returnBodyInfo(sendShippingMethodResponse.body);
          console.log(`[${moment().format('HH:mm:ss:SSS')}] - Finished Checkout`);
          this.handleChangeStatus('Sending Payment Info');
          const checkoutResponse = await this.sendCheckoutInfo(paymentToken, shipping.price, paymentID, checkoutBodyInfo.authToken, checkoutURL, orderTotal);
          await this.pollQueueOrCheckout(checkoutResponse.request.href);
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
      const checkoutResponse = await this.sendCheckoutInfo(paymentToken, shipping.price, paymentID, checkoutBodyInfo.authToken, checkoutURL, orderTotal);
      await this.pollQueueOrCheckout(checkoutResponse.request.href);
    }
  };

  checkoutWithVariant = async variantID => {
    try {
      console.log(`[${moment().format('HH:mm:ss:SSS')}] - Adding To Cart`);
      this.handleChangeStatus('Adding To Cart');
      await this.addToCart(variantID, this.options.task.quantity);
      console.log(`[${moment().format('HH:mm:ss:SSS')}] - Getting  Shipping and Payment Tokens`);
      this.handleChangeStatus('Getting Shipping and Payment Tokens');
      const [paymentToken, shipping] = await Promise.all([this.generatePaymentToken(), this.getShippingToken()]);
      let checkoutURL = this.shopifyCheckoutURL;
      if (captchaNeeded[this.options.task.store]) {
        ipcRenderer.send(OPEN_CAPTCHA_WINDOW, 'open');
        console.log(this.cookieJar.getCookieString(checkoutURL));
        ipcRenderer.send(BOT_SEND_COOKIES_AND_CAPTCHA_PAGE, {
          cookies: `${this.cookieJar.getCookieString(checkoutURL)}`,
          checkoutURL: checkoutURL,
          id: this.tokenID,
          proxy: this.proxy,
          baseURL: stores[this.options.task.store]
        });
        this.handleChangeStatus('Waiting For Captcha');
        ipcRenderer.on(RECEIVE_CAPTCHA_TOKEN, async (event, captchaToken) => {
          if (captchaToken.checkoutURL.includes('stock_problems') && this.settings.monitorForRestock) {
            this.handleChangeStatus('Monitoring For Restock');
            await this.pollQueueOrCheckout(captchaToken.checkoutURL);
          } else if (url.includes('stock_problems') && !this.settings.monitorForRestock) {
            this.handleChangeStatus('Out Of Stock');
          } else {
            this.handleChangeStatus('Checking Out');
            const checkoutBody = await this.getCheckoutBody(checkoutURL);
            const bodyInfo = this.returnBodyInfo(checkoutBody);
            const paymentID = bodyInfo.paymentID;
            const authToken = bodyInfo.authToken;
            const orderTotal = bodyInfo.orderTotal;
            console.log(`[${moment().format('HH:mm:ss:SSS')}] - Sending Customer Info`);
            this.handleChangeStatus('Sending Customer Info');
            const sendCustomerInfoResponse = await this.sendCustomerInfo(checkoutURL, authToken, captchaToken.captchaResponse);
            const sendShippingMethodBodyInfo = this.returnBodyInfo(sendCustomerInfoResponse.body);
            console.log(`[${moment().format('HH:mm:ss:SSS')}] - Sending Shipping Info`);
            this.handleChangeStatus('Sending Shipping Info');
            const sendShippingMethodResponse = await this.sendShippingMethod(shipping.token, checkoutURL, sendShippingMethodBodyInfo.authToken);
            const checkoutBodyInfo = this.returnBodyInfo(sendShippingMethodResponse.body);
            console.log(`[${moment().format('HH:mm:ss:SSS')}] - Finished Checkout`);
            this.handleChangeStatus('Sending Payment Info');
            const checkoutResponse = await this.sendCheckoutInfo(paymentToken, shipping.price, paymentID, checkoutBodyInfo.authToken, checkoutURL, orderTotal);
            await this.pollQueueOrCheckout(checkoutResponse.request.href);
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
        const checkoutResponse = await this.sendCheckoutInfo(paymentToken, shipping.price, paymentID, checkoutBodyInfo.authToken, checkoutURL, orderTotal);
        await this.pollQueueOrCheckout(checkoutResponse.request.href);
      }
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
      this.stop(false);
    }
  };
}
