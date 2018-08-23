const request = require('request-promise');
const _ = require('lodash');
const ipcRenderer = require('electron').ipcRenderer;
const cheerio = require('cheerio');
const moment = require('moment');
const uuidv4 = require('uuid/v4');
import stores from '../store/shops';
import { SEND_SUPREME_CHECKOUT_COOKIE, OPEN_CAPTCHA_WINDOW, RECEIVE_SUPREME_CAPTCHA_URL, SEND_SUPREME_CAPTCHA_URL, BOT_SEND_COOKIES_AND_CAPTCHA_PAGE, RECEIVE_CAPTCHA_TOKEN } from '../utils/constants';
export default class Supreme {
  constructor(options, keywords, handleChangeStatus, settings, proxy, monitorProxy) {
    this.startTime = '';
    this.options = options;
    this.keywords = keywords;
    this.handleChangeStatus = handleChangeStatus;
    this.settings = settings;
    this.proxy = proxy;
    this.monitorProxy = monitorProxy;
    this.active = true;
    this.monitoring = false;
    this.monitoringTimeout = '';
    this.runOnce = false;
    this.cookieJar = request.jar();
    this.rp = request.defaults({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.117 Safari/537.36',
        Cookie: this.cookieJar.getCookieString('supremenewyork.com/')
      },
      jar: this.cookieJar,
      proxy: this.options.task.proxy === '' ? (this.proxy !== undefined ? `http://${this.proxy.user}:${this.proxy.pass}@${this.proxy.ip}:${this.proxy.port}` : this.options.task.proxy) : ''
    });
  }

  sleep = ms => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  sendSupremeCheckoutCookie = args => {
    ipcRenderer.send(SEND_SUPREME_CHECKOUT_COOKIE, args);
  };

  stop = () => {
    clearTimeout(this.monitoringTimeout);
    this.active = false;
    this.handleChangeStatus('Stopped');
  };

  getCardType = number => {
    var re = new RegExp('^4');
    if (number.match(re) != null) return 'visa';
    if (/^(5[1-5][0-9]{14}|2(22[1-9][0-9]{12}|2[3-9][0-9]{13}|[3-6][0-9]{14}|7[0-1][0-9]{13}|720[0-9]{12}))$/.test(number)) return 'master';
    re = new RegExp('^3[47]');
    if (number.match(re) != null) return 'american_express';
    re = new RegExp('^(6011|622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[0-1][0-9]|92[0-5]|64[4-9])|65)');
    return '';
  };

  checkoutWithCapctcha = async captchaToken => {
    const payload = {
      utf8: '\u2713',
      authenticity_token: '',
      'order[billing_name]': this.options.profile.billingFirstName,
      'order[email]': this.options.profile.paymentEmail,
      'order[tel]': this.options.profile.phoneNumber,
      'order[billing_address]': this.options.profile.billingAddress,
      'order[billing_address_2]': '',
      'order[billing_address_3]': '',
      'order[billing_city]': this.options.profile.billingCity,
      'order[billing_zip]': this.options.profile.billingZip,
      'order[billing_country]': this.options.profile.billingCountry,
      same_as_billing_address: '1',
      store_credit_id: '0',
      'credit_card[type]': this.getCardType(this.options.profile.paymentCardnumber),
      'credit_card[cnb]': this.options.profile.paymentCardnumber,
      'credit_card[month]': this.options.profile.paymentCardExpiryMonth,
      'credit_card[year]': this.options.profile.paymentCardExpiryYear,
      'credit_card[vval]': this.options.profile.paymentCVV,
      'order[terms]': '1',
      'g-recaptcha-response': captchaToken,
      hpcvv: ''
    };
    try {
      const response = await this.rp({
        method: 'POST',
        form: payload,
        uri: 'https://www.supremenewyork.com/checkout.js',
        json: true,
        resolveWithFullResponse: true,
        followAllRedirects: true
      });
      console.log(`[${moment().format('HH:mm:ss:SSS')}] - Finished Supreme Checkout`);
      if (response.body.includes('Unfortunately, we cannot process your payment. This could be due to  your payment being declined by your card issuer.')) {
        this.handleChangeStatus('Error Processing Payment');
      }
      return response;
    } catch (e) {
      console.error(e);
    }
  };

  getProductStyleID = async (productID, color, sizeInput) => {
    try {
      const response = await this.rp({
        method: 'GET',
        json: true,
        uri: `http://www.supremenewyork.com/shop/${productID}.json`
      });
      const styles = response.styles;
      if (styles.length === 1) {
        for (const size of styles[0].sizes) {
          if (size !== '' && size.name === sizeInput) {
            return [styles[0].id, size.id];
          } else {
            return [styles[0].id, size.id];
          }
        }
      } else {
        for (const style of styles) {
          const styleArray = style.name.toLowerCase().split(/[^a-zA-Z0-9']/);
          const styleKeywordsArray = color.toLowerCase().split(/[^a-zA-Z0-9']/);
          if (_.difference(styleKeywordsArray, styleArray).length === 0) {
            const sizes = style.sizes;
            for (const size of sizes) {
              if (size.name === sizeInput) {
                return [style.id, size.id];
              }
            }
          }
        }
      }
    } catch (e) {
      this.handleChangeStatus('Error Getting Supreme Product Style');
      console.error(e);
    }
  };

  getProduct = async () => {
    try {
      const response = await this.rp({
        method: 'GET',
        json: true,
        uri: 'http://www.supremenewyork.com/shop.json'
      });
      const categoryOfProducts = response.products_and_categories[this.options.task.category];
      const product = this.findProductWithKeyword(categoryOfProducts, this.keywords);
      const [styleID, sizeID] = await this.getProductStyleID(product.id, this.options.task.color, this.options.task.size);
      return [product.id, styleID, sizeID];
    } catch (e) {
      this.handleChangeStatus('Error Getting Supreme Products');
      if (this.active) {
        this.monitoring = true;
        this.handleChangeStatus('Monitoring');
        this.monitoringTimeout = setTimeout(this.checkout, this.settings.monitorTime);
      } else {
        clearTimeout(this.monitoringTimeout);
      }
      console.error(e);
    }
  };

  addToCart = async (productID, styleID, sizeID) => {
    const payload = {
      utf8: '\u2713',
      style: styleID,
      size: sizeID,
      commit: 'add to basket'
    };
    try {
      const response = await this.rp({
        method: 'POST',
        form: payload,
        uri: `http://www.supremenewyork.com/shop/${productID}/add`,
        gzip: true,
        resolveWithFullResponse: true,
        followAllRedirects: true
      });
      return response;
    } catch (e) {
      console.error(e);
    }
  };

  findProductWithKeyword = (productArray, keywords) => {
    for (const product of productArray) {
      const productName = product.name;
      if (productName !== undefined) {
        const productNameArray = productName.toLowerCase().split(/[^a-zA-Z0-9']/);
        if (_.difference(keywords.positiveKeywords, productNameArray).length === 0 && _.difference(keywords.negativeKeywords, productNameArray).length === keywords.negativeKeywords.length) {
          return product;
        }
      }
    }
  };

  checkout = async () => {
    const tokenID = uuidv4();
    // console.log(`[${moment().format('HH:mm:ss:SSS')}] - Started Supreme Checkout`);
    // this.startTime = Date.now();
    // // this.recieveCaptchaTokenURL(tokenID);
    // const [productID, styleID, sizeID] = await this.getProduct();
    // const addToCart = await this.addToCart(productID, styleID, sizeID);
    // const checkoutCookies = await addToCart.request.headers.Cookie;
    // this.sendSupremeCheckoutCookie({ cookies: checkoutCookies, proxy: this.proxy, id: tokenID });
    // this.handleChangeStatus('Waiting for captcha');
    ipcRenderer.send(OPEN_CAPTCHA_WINDOW, 'open');
    const [productID, styleID, sizeID] = await this.getProduct();
    const addToCart = await this.addToCart(productID, styleID, sizeID);
    const checkoutCookies = await addToCart.request.headers.Cookie;
    ipcRenderer.send(BOT_SEND_COOKIES_AND_CAPTCHA_PAGE, {
      cookies: this.cookieJar.getCookieString(stores[this.options.task.store]),
      checkoutURL: 'http://supremenewyork.com/checkout',
      baseURL: stores[this.options.task.store],
      id: tokenID
    });
    this.handleChangeStatus('Waiting For Captcha');
    ipcRenderer.on(RECEIVE_CAPTCHA_TOKEN, async (event, args) => {
      if (tokenID === args.id) {
        console.log(args.id);
        this.handleChangeStatus(`Waiting ${this.settings.checkoutTime}ms`);
        await this.sleep(this.settings.checkoutTime);
        this.handleChangeStatus('Fake Checkout');
        // this.checkoutWithCapctcha(args.captchaResponse);
        // ipcRenderer.removeAllListeners(RECEIVE_CAPTCHA_TOKEN);
      }
    });
  };
}
