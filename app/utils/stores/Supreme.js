const request = require('request-promise');
const _ = require('lodash');
const ipcRenderer = require('electron').ipcRenderer;
const cheerio = require('cheerio');
var tough = require('tough-cookie');
const moment = require('moment');
const uuidv4 = require('uuid/v4');
const log = require('electron-log');
import stores from '../../store/shops';
import countryCodes from '../../store/countryCodes';
import states from '../../store/states';
import {
  SEND_SUPREME_CHECKOUT_COOKIE,
  OPEN_CAPTCHA_WINDOW,
  FINISH_SENDING_CAPTCHA_TOKEN,
  BOT_SEND_COOKIES_AND_CAPTCHA_PAGE,
  RECEIVE_CAPTCHA_TOKEN
} from '../constants';
export default class Supreme {
  constructor(options, keywords, handleChangeStatus, settings, proxy, monitorProxy, stopTask, handleChangeProductName, run, index) {
    this.startTime = '';
    this.price = '';
    this.currency = '';
    this.stopTask = stopTask;
    this.handleChangeProductName = handleChangeProductName;
    this.options = options;
    this.keywords = keywords;
    this.handleChangeStatus = handleChangeStatus;
    this.settings = settings;
    this.run = run;
    this.index = index;
    this.productID = '';
    this.styleID = '';
    this.sizeID = '';
    this.monitorDelay = this.returnMonitorDelay();
    this.checkoutDelay = options.task.checkoutDelay === '' && options.task.checkoutDelay !== undefined ? settings.checkoutTime : options.task.checkoutDelay;
    this.proxy =
      this.options.task.proxy === ''
        ? proxy !== undefined
          ? `http://${this.proxy.user}:${this.proxy.pass}@${this.proxy.ip}:${this.proxy.port}`
          : this.options.task.proxy
        : `http://${this.options.task.proxy}`;
    this.monitorProxy = monitorProxy;
    this.active = true;
    this.monitoring = false;
    this.monitoringTimeout = '';
    this.cookieJar = request.jar();
    this.tokenID = uuidv4();
    this.monitoringRefreshCount = 0;
    this.rp = request.defaults({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36'
        // Cookie: this.cookieJar.getCookieString('supremenewyork.com/')
      },
      jar: this.cookieJar,
      proxy: this.proxy
    });
  }

  returnMonitorDelay() {
    if (this.options.task.monitorDelay !== '' && this.options.task.monitorDelay !== undefined) {
      return this.options.task.monitorDelay;
    } else if (this.settings.restockMonitorTime !== '' && this.settings.restockMonitorTime !== undefined) {
      return this.settings.restockMonitorTime;
    } else {
      return this.settings.monitorTime;
    }
  }

  sleep = ms => {
    console.log(`[${moment().format('HH:mm:ss:SSS')}] - Sleeping For ${ms}ms`);
    log.info(`[Task - ${this.index + 1}] - Sleeping For ${ms}ms`);
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  sendSupremeCheckoutCookie = args => {
    ipcRenderer.send(SEND_SUPREME_CHECKOUT_COOKIE, args);
  };

  stop = () => {
    clearTimeout(this.monitoringTimeout);
    this.active = false;
  };

  stopMonitoring = () => {
    this.monitoring = false;
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

  jsonToQueryString = json => {
    return `?${Object.keys(json)
      .map(function(key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(json[key]);
      })
      .join('&')}`;
  };

  checkoutWithCapctcha = async (captchaToken, authToken, cookies) => {
    log.info(`[Task - ${this.index + 1}] - Checking Out With Captcha`);
    let payload;
    if (this.options.task.store === 'supreme-eu') {
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
        hpcvv: ''
      };
    } else if (this.options.task.store === 'supreme-us') {
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
        'order[billing_country]':
          this.options.profile.billingCountry === 'United States' ? 'USA' : this.options.profile.billingCountry === 'Canada' ? 'CANADA' : '',
        asec: 'Rmasn',
        same_as_billing_address: '1',
        store_credit_id: '',
        'credit_card[nlb]': this.string_chop(this.options.profile.paymentCardnumber, 4).join(' '),
        'credit_card[month]': this.options.profile.paymentCardExpiryMonth,
        'credit_card[year]': this.options.profile.paymentCardExpiryYear,
        'credit_card[rvv]': this.options.profile.paymentCVV,
        'order[terms]': '1',
        'credit_card[vval]': '862'
      };
    }
    if (!this.options.task.captchaBypass) {
      payload['g-recaptcha-response'] = captchaToken;
    }
    try {
      console.log(`[${moment().format('HH:mm:ss:SSS')}] - Finished Supreme Checkout`);
      const response = await this.rp({
        headers: { cookie: `${this.cookieJar.getCookieString('https://www.supremenewyork.com')};${cookies}` },
        method: 'POST',
        form: payload,
        uri: 'https://www.supremenewyork.com/checkout.js',
        json: true,
        resolveWithFullResponse: true,
        followAllRedirects: true
      });
      console.log(response);
      if (response.body.includes('Unfortunately, we cannot process your payment. This could be due to  your payment being declined by your card issuer.')) {
        this.handleChangeStatus('Error Processing Payment');
      } else if (response.body.includes('number is not a valid credit card number')) {
        this.handleChangeStatus('Number Is Not A Valid Credit Card Number');
      } else {
        this.handleChangeStatus('Check Email');
      }
      this.stopTask(true);
      return response;
    } catch (e) {
      log.error(`[Task - ${this.index + 1}] - ${e}`);
      this.handleChangeStatus(e.message);
      if (this.settings.retryOnCheckoutError && this.active) {
        this.handleChangeStatus('Error Checking Out - Retrying');
        this.retryOnError(captchaToken, authToken, cookies);
      }
      console.error(e);
    }
    this.stopTask(true);
  };

  retryOnError = async (captchaToken, authToken, cookies) => {
    log.error(`[Task - ${this.index + 1}] - Retrying After Error`);
    await this.sleep(this.settings.errorTime);
    this.checkoutWithCapctcha(captchaToken, authToken, cookies);
  };

  getSupremeHomepage = async () => {
    await this.rp({
      method: 'GET',
      uri: `https://www.supremenewyork.com/checkout.js`,
      resolveWithFullResponse: true
    });
  };

  getProductStyleID = async (productID, color, sizeInput) => {
    log.info(`[Task - ${this.index + 1}] - Getting Product Style ID`);
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
      log.error(`[Task - ${this.index + 1}] - ${e}`);
      this.handleChangeStatus('Error Getting Supreme Product Style');
      console.error(e);
      return ['', '', ''];
    }
  };

  getProduct = async () => {
    log.info(`[Task - ${this.index + 1}] - Getting Product`);
    try {
      const response = await this.rp({
        method: 'GET',
        json: true,
        uri: 'https://www.supremenewyork.com/shop.json'
      });
      const categoryOfProducts = response.products_and_categories[this.options.task.category];
      const product = this.findProductWithKeyword(categoryOfProducts, this.keywords);
      if (product !== undefined) {
        if (this.options.task.priceCheckVal === '' || parseFloat(this.options.task.priceCheckVal) < product.price / 100) {
          this.handleChangeProductName(product.name);
          const [styleID, sizeID] = await this.getProductStyleID(product.id, this.options.task.color, this.options.task.size);
          if (styleID !== '') {
            return [product.id, styleID, sizeID];
          } else {
            throw new Error('Style For Product Not Found');
          }
        } else {
          throw new Error('Item Costs More Than Price Check');
        }
      } else {
        if (this.active) {
          this.monitoringRefreshCount++;
          this.monitoring = true;
          this.monitoringTimeout = setTimeout(this.checkout, this.monitorDelay);
          console.error(`Monitoring - Product Not Currently Found - ${this.options.task.keywords}`);
          this.handleChangeStatus(`Monitoring - Product Not Currently Found ${this.monitoringRefreshCount}`);
          return ['', '', ''];
        } else {
          clearTimeout(this.monitoringTimeout);
        }
      }
    } catch (e) {
      console.error(e);
      log.error(`[Task - ${this.index + 1}] - ${e}`);
      if (this.active && e.message === 'Style For Product Not Found') {
        console.error(`Monitoring - Size/Style Not Currently Found - ${this.options.task.keywords}`);
        this.monitoring = true;
        this.handleChangeStatus('Monitoring - Size/Style Not Currently Found');
        this.monitoringTimeout = setTimeout(this.checkout, this.monitorDelay);
        return ['', '', ''];
      } else if (e.message === 'Item Costs More Than Price Check') {
        this.handleChangeStatus('Item Costs More Than Price Check');
        clearTimeout(this.monitoringTimeout);
        this.active = false;
      } else {
        clearTimeout(this.monitoringTimeout);
      }
    }
  };

  getAuthToken = body => {
    const $ = cheerio.load(body);
    return $('meta[name="csrf-token"]').attr('content');
  };

  addToCart = async (productID, styleID, sizeID) => {
    log.info(`[Task - ${this.index + 1}] - Adding To Cart`);
    this.productID = productID;
    this.styleID = styleID;
    this.sizeID = sizeID;
    if (this.options.task.atcBypass) {
      let cart1Cookie = new tough.Cookie({
        key: 'cart',
        value: `1+item--${sizeID}%2C${styleID}`,
        domain: 'www.supremenewyork.com',
        path: '/'
      });
      let cart2Cookie = new tough.Cookie({
        key: '_supreme_sess',
        value: `WUU5S0gvZk14d0ZqRDR4alUzVXZJUkYyeGwzQ1NuUktvanNqQzBPUWJ3cnNjU3g1QUM0QVBuaW1PQW5XNEV6NktwdFpwRzVlRjJPSDNKWVBHS0R2WmFjQ2hXVTRQS2hNYlltbmlNNlVTSUdRU0dxM0JNTnVycEJURVVac2RHNk0vUlkySXBwNWJtNEkrb3grb1hTQ0Z0eFNYV1Z6Vy9vWFJmZHErNjA5dTFUTWNXcmhvS2ZCNkc4TjE4UVJGWW94VmNydGgyU1Fpc1MveUE2WmUweFErSmQ2RnUwRmR6ZGt5bXV2V2p4QXNEM3U1MXo5NlZIRHUvL203YnkwMkVnUDBQbHdVT0NrTHFQU3ZkanVQV3pWcENLVFUzZHJnUFoyQ0c3NVVjZE5yQVMyZ2VGRFhlQUdYTE1DQXUrRWdHcFFjWGd6TmFvbzJFK0tmekFKa0FmK1RYTC9VeGExSzRwdmVsWlFGVDR3TTcvRXY3UGNGK3J0SC9mekNRV3Z2MmhWWm04ckd6eTdzY3d1S3VTV2NHR3M4dDNMd0RHUGZ1OFpuZGFHWUg1V3NoK0RneUJCMTB0SDJ3ZzN0TTZiYXFudU5VUXFQdm5FWTYrN3RYenFXMnlzamdpSWJ5ZU5tQjZ4YVk4REtCK085ODI3OE5zK3p6OStmRjNSbkNSYnFtSXlrTjJtOHlIR1JxY1plV2xLY0dISUtzRUxJSTNBYVNIME9uYzlhVG5aaXFnQnlQdFh3ZXZuSEFweEpNVTJxS2hQSmFkRXo0MnFGb2ZWZFRTSUp0azFzWEtzd1hha1dkcHVqTFE1TUxoYm1GeTJrcmRUMVR5anp3bXZFMHF0N2FxbitQUk94bGxScS9DczQ3WUozbkUrbUE9PS0tTmRDQ2w5dXpNbUhGRVJlbTZ1WitoUT09--90da156b6815d08ccb88f6a7370057cf2d6f2d1f`,
        domain: '.supremenewyork.com',
        path: '/'
      });
      let cart3Cookie = new tough.Cookie({
        key: 'request_method',
        value: `POST`,
        domain: '.supremenewyork.com',
        path: '/'
      });
      this.cookieJar.setCookie(cart1Cookie.toString(), stores[this.options.task.store]);
      this.cookieJar.setCookie(cart2Cookie.toString(), stores[this.options.task.store]);
      this.cookieJar.setCookie(cart3Cookie.toString(), stores[this.options.task.store]);
      this.rp({
        method: 'GET',
        uri: `https://www.supremenewyork.com/checkout.js`,
        resolveWithFullResponse: true
      });
    } else {
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
        console.log(response);
        return this.getAuthToken(response.body);
      } catch (e) {
        console.error(e);
        log.error(`[Task - ${this.index + 1}] - ${e}`);
      }
    }
  };

  findProductWithKeyword = (productArray, keywords) => {
    log.info(`[Task - ${this.index + 1}] - Finding Product With Keyword`);
    if (keywords.positiveKeywords.length === 0 && keywords.negativeKeywords.length === 0) {
      return undefined;
    } else {
      for (const product of productArray) {
        const productName = product.name;
        if (productName !== undefined) {
          const productNameArray = productName.toLowerCase().split(/[^a-zA-Z0-9']/);
          if (
            _.difference(keywords.positiveKeywords, productNameArray).length === 0 &&
            _.difference(keywords.negativeKeywords, productNameArray).length === keywords.negativeKeywords.length
          ) {
            return product;
          }
        }
      }
    }
  };

  monitorForRestock = async (productID, styleID, sizeID) => {
    log.info(`[Task - ${this.index + 1}] - Monitoring For Restock`);
    console.log(`[${moment().format('HH:mm:ss:SSS')}] - Monitoring For Restock`);
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
    if (stockLevel > 0) {
      this.checkout(productID, styleID, sizeID);
    } else if (this.monitoring) {
      await this.sleep(this.monitorDelay);
      await this.monitorForRestock(productID, styleID, sizeID);
    }
  };

  checkStock = async (productID, styleID, sizeID) => {
    log.info(`[Task - ${this.index + 1}] - Checking Stock`);
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
    if (stockLevel === 0) {
      throw 'Out Of Stock';
    }
  };

  checkout = async (productID, styleID, sizeID) => {
    console.log(`[${moment().format('HH:mm:ss:SSS')}] - Started Supreme Checkout`);
    log.info(`[Task - ${this.index + 1}] - Started Supreme Checkout`);
    if (productID === undefined) {
      [productID, styleID, sizeID] = await this.getProduct();
    }
    if (productID !== '') {
      try {
        await this.getSupremeHomepage();
        await this.checkStock(productID, styleID, sizeID);
        const authToken = await this.addToCart(productID, styleID, sizeID);
        if (this.options.task.captchaBypass) {
          this.handleChangeStatus(`Waiting ${this.checkoutDelay}ms`);
          await this.sleep(this.checkoutDelay);
          if (this.active) {
            this.checkoutWithCapctcha('', authToken);
          }
        } else {
          ipcRenderer.send(OPEN_CAPTCHA_WINDOW, 'open');
          ipcRenderer.send(BOT_SEND_COOKIES_AND_CAPTCHA_PAGE, {
            cookies: this.cookieJar.getCookieString(stores[this.options.task.store]),
            checkoutURL: 'https://supremenewyork.com/checkout',
            baseURL: stores[this.options.task.store],
            id: this.tokenID,
            proxy: this.proxy,
            profile: this.options.profile
          });
          console.log(`[${moment().format('HH:mm:ss:SSS')}] - Waiting For Captcha`);
          this.handleChangeStatus('Waiting For Captcha');
          ipcRenderer.on(RECEIVE_CAPTCHA_TOKEN, async (event, args) => {
            if (this.tokenID === args.id) {
              console.log(args);
              ipcRenderer.send(FINISH_SENDING_CAPTCHA_TOKEN, { url: stores[this.options.task.store], cookieNames: ['_supreme_sess', 'cart'] });
              this.handleChangeStatus(`Waiting ${this.checkoutDelay}ms`);
              await this.sleep(this.checkoutDelay);
              this.checkoutWithCapctcha(args.captchaResponse, args.supremeAuthToken, args.cookies);
            }
          });
        }
      } catch (e) {
        console.log(e);
        log.error(`[Task - ${this.index + 1}] - ${e}`);
        if (e === 'Out Of Stock') {
          this.handleChangeStatus('Out Of Stock');
          if (this.settings.monitorForRestock) {
            this.handleChangeStatus('Monitoring For Restock');
            this.monitoring = true;
            while (this.monitoring) {
              await this.monitorForRestock(productID, styleID, sizeID);
            }
          } else {
            this.stopTask(true);
          }
        }
      }
    }
  };
}
