const request = require('request-promise');
const _ = require('lodash');
const ipcRenderer = require('electron').ipcRenderer;
const cheerio = require('cheerio');
const moment = require('moment');
const uuidv4 = require('uuid/v4');
import stores from '../store/shops';
import countryCodes from '../store/countryCodes';
import states from '../store/states';
import { SEND_SUPREME_CHECKOUT_COOKIE, OPEN_CAPTCHA_WINDOW, FINISH_SENDING_CAPTCHA_TOKEN, BOT_SEND_COOKIES_AND_CAPTCHA_PAGE, RECEIVE_CAPTCHA_TOKEN } from '../utils/constants';
export default class Supreme {
  constructor(options, keywords, handleChangeStatus, settings, proxy, monitorProxy, stopTask, handleChangeProductName) {
    this.startTime = '';
    this.stopTask = stopTask;
    this.handleChangeProductName = handleChangeProductName;
    this.options = options;
    this.keywords = keywords;
    this.handleChangeStatus = handleChangeStatus;
    this.settings = settings;
    this.proxy = this.options.task.proxy === '' ? (proxy !== undefined ? `http://${this.proxy.user}:${this.proxy.pass}@${this.proxy.ip}:${this.proxy.port}` : this.options.task.proxy) : `http://${this.options.task.proxy}`;
    this.monitorProxy = monitorProxy;
    this.active = true;
    this.monitoring = false;
    this.monitoringTimeout = '';
    this.runOnce = false;
    this.cookieJar = request.jar();
    this.tokenID = uuidv4();
    this.rp = request.defaults({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36'
        // Cookie: this.cookieJar.getCookieString('supremenewyork.com/')
      },
      jar: this.cookieJar,
      proxy: this.proxy
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

  string_chop = (str, size) => {
    if (str == null) return [];
    str = String(str);
    size = ~~size;
    return size > 0 ? str.match(new RegExp('.{1,' + size + '}', 'g')) : [str];
  };

  checkoutWithCapctcha = async (captchaToken, authToken) => {
    let payload;
    console.log(this.options.task.store);
    if (this.options.task.store === 'Supreme-UK') {
      payload = {
        utf8: '\u2713',
        authenticity_token: authToken,
        'order[billing_name]': `${this.options.profile.billingFirstName} ${this.options.profile.billingLastName}`,
        'order[email]': this.options.profile.paymentEmail,
        'order[tel]': this.options.profile.phoneNumber,
        'order[billing_address]': this.options.profile.billingAddress,
        'order[billing_address_2]': '',
        'order[billing_address_3]': this.options.profile.billingCity,
        'order[billing_city]': this.options.profile.billingCity,
        'order[billing_zip]': this.options.profile.billingZip,
        'order[billing_country]': countryCodes[this.options.profile.billingCountry],
        same_as_billing_address: '1',
        store_credit_id: '',
        'credit_card[type]': this.getCardType(this.options.profile.paymentCardnumber),
        'credit_card[cnb]': this.string_chop(this.options.profile.paymentCardnumber, 4).join(' '),
        'credit_card[month]': this.options.profile.paymentCardExpiryMonth,
        'credit_card[year]': this.options.profile.paymentCardExpiryYear,
        'credit_card[vval]': this.options.profile.paymentCVV,
        'order[terms]': '1',
        'g-recaptcha-response': captchaToken,
        hpcvv: ''
      };
    } else if (this.options.task.store === 'Supreme-US') {
      payload = {
        utf8: '\u2713',
        authenticity_token: authToken,
        'order[billing_name]': `${this.options.profile.billingFirstName} ${this.options.profile.billingLastName}`,
        'order[email]': this.options.profile.paymentEmail,
        'order[tel]': this.options.profile.phoneNumber,
        'order[billing_address]': this.options.profile.billingAddress,
        'order[billing_address_2]': this.options.profile.billingAptorSuite,
        'order[billing_zip]': this.options.profile.billingZip,
        'order[billing_city]': this.options.profile.billingCity,
        'order[billing_state]': states[this.options.profile.billingProvince],
        'order[billing_country]': this.options.profile.billingCountry === 'United States' ? 'USA' : this.options.profile.billingCountry === 'Canada' ? 'CANADA' : '',
        asec: 'Rmasn',
        same_as_billing_address: '1',
        store_credit_id: '',
        'credit_card[nlb]': this.string_chop(this.options.profile.paymentCardnumber, 4).join(' '),
        'credit_card[month]': this.options.profile.paymentCardExpiryMonth,
        'credit_card[year]': this.options.profile.paymentCardExpiryYear,
        'credit_card[rvv]': this.options.profile.paymentCVV,
        'order[terms]': '1',
        'g-recaptcha-response': captchaToken,
        'credit_card[vval]': '862'
      };
    }
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
      } else if (response.body.includes('number is not a valid credit card number')) {
        this.handleChangeStatus('Number Is Not A Valid Credit Card Number');
      } else {
        this.handleChangeStatus('Check Email');
      }
      return response;
    } catch (e) {
      this.handleChangeStatus(e.message);
      console.error(e);
    }
    this.stopTask(true);
  };

  getProductStyleID = async (productID, color, sizeInput) => {
    try {
      const response = await this.rp({
        method: 'GET',
        json: true,
        uri: `https://www.supremenewyork.com/shop/${productID}.json`
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
              const sizeArray = size.name.toLowerCase().split(/[^a-zA-Z0-9']/);
              const sizeKeywordsArray = sizeInput.toLowerCase().split(/[^a-zA-Z0-9']/);
              if (_.difference(sizeKeywordsArray, sizeArray).length === 0) {
                return [style.id, size.id];
              }
            }
          }
        }
        return ['', '', ''];
      }
    } catch (e) {
      this.handleChangeStatus('Error Getting Supreme Product Style');
      console.error(e);
      return ['', '', ''];
    }
  };

  getProduct = async () => {
    try {
      const response = await this.rp({
        method: 'GET',
        json: true,
        uri: 'https://www.supremenewyork.com/shop.json'
      });
      console.log(response);
      const categoryOfProducts = response.products_and_categories[this.options.task.category];
      const product = this.findProductWithKeyword(categoryOfProducts, this.keywords);
      if (product !== undefined) {
        this.handleChangeProductName(product.name);
        const [styleID, sizeID] = await this.getProductStyleID(product.id, this.options.task.color, this.options.task.size);
        if (styleID !== '') {
          return [product.id, styleID, sizeID];
        } else {
          throw error;
        }
      } else {
        if (this.active) {
          this.monitoring = true;
          this.monitoringTimeout = setTimeout(this.checkout, this.settings.monitorTime);
          console.error(`Monitoring - Product Not Currently Found - ${this.options.task.keywords}`);
          this.handleChangeStatus('Monitoring - Product Not Currently Found');
          return ['', '', ''];
        } else {
          clearTimeout(this.monitoringTimeout);
        }
      }
    } catch (e) {
      console.log(e);
      if (this.active) {
        console.error(`Monitoring - Size/Style Not Currently Found - ${this.options.task.keywords}`);
        this.monitoring = true;
        this.handleChangeStatus('Monitoring - Size/Style Not Currently Found');
        this.monitoringTimeout = setTimeout(this.checkout, this.settings.monitorTime);
        return ['', '', ''];
      } else {
        clearTimeout(this.monitoringTimeout);
      }
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
        uri: `https://www.supremenewyork.com/shop/${productID}/add`,
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

  checkStock = async (productID, styleID, sizeID) => {
    const response = await this.rp({
      method: 'GET',
      uri: `https://www.supremenewyork.com/shop/${productID}.json`,
      gzip: true,
      json: true,
      followAllRedirects: true
    });
    const matchingStyle = response.styles.filter(element => element.id === styleID);
    const matchingSize = matchingStyle[0].sizes.filter(element => element.id === sizeID);
    const stockLevel = matchingSize[0].stock_level;
    return stockLevel;
  };

  checkout = async () => {
    ipcRenderer.send(OPEN_CAPTCHA_WINDOW, 'open');
    const [productID, styleID, sizeID] = await this.getProduct();
    console.log(productID, styleID, sizeID);
    if (productID !== '') {
      const stockLevel = await this.checkStock(productID, styleID, sizeID);
      if (stockLevel > 0) {
        const addToCart = await this.addToCart(productID, styleID, sizeID);
        // const checkoutCookies = await addToCart.request.headers.Cookie;
        // console.log(this.cookieJar.getCookieString(stores[this.options.task.store]));
        ipcRenderer.send(BOT_SEND_COOKIES_AND_CAPTCHA_PAGE, {
          cookies: this.cookieJar.getCookieString(stores[this.options.task.store]),
          checkoutURL: 'https://supremenewyork.com/checkout',
          baseURL: stores[this.options.task.store],
          id: this.tokenID,
          proxy: this.proxy
        });
        this.handleChangeStatus('Waiting For Captcha');
        ipcRenderer.on(RECEIVE_CAPTCHA_TOKEN, async (event, args) => {
          // ipcRenderer.removeAllListeners(RECEIVE_CAPTCHA_TOKEN);
          if (this.tokenID === args.id) {
            this.handleChangeStatus(`Waiting ${this.settings.checkoutTime}ms`);
            await this.sleep(this.settings.checkoutTime);
            // this.handleChangeStatus('Fake Checkout');
            ipcRenderer.send(FINISH_SENDING_CAPTCHA_TOKEN, 'finised');
            this.checkoutWithCapctcha(args.captchaResponse, args.supremeAuthToken);
          }
        });
      } else {
        this.handleChangeStatus('Out Of Stock');
        this.stopTask(true);
      }
    } else {
      // this.handleChangeStatus('Monitoring - Product Not Currently Found');
      // this.stop();
    }
  };
}
