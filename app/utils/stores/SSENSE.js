const request = require('request-promise');
const _ = require('lodash');
const cheerio = require('cheerio');
const uuidv4 = require('uuid/v4');
const log = require('electron-log');
import stores from '../../store/shops';
import countryCodes from '../../store/countryCodes';
import countries from '../../store/countries';
const sizeSynonymns = {
  XSmall: ['XSMALL', 'XS', 'XSmall', 'X-Small'],
  Small: ['SMALL', 'S', 'Small'],
  Medium: ['Medium', 'M', 'MEDIUM', 'Med', 'MED'],
  Large: ['LARGE', 'L', 'Large'],
  XLarge: ['XLARGE', 'X-Large', 'X-LARGE', 'XL'],
  XXLarge: ['XXLARGE', 'XX-Large', 'XXL', 'XX-LARGE'],
  'N/A': ['N/A', 'Default Title', 'One Size']
};
export default class SSENSE {
  constructor(options, keywords, handleChangeStatus, handleChangeProductName, proxy, stop, cookieJar, settings, run, index) {
    this.options = options;
    this.keywords = keywords;
    this.handleChangeStatus = handleChangeStatus;
    this.handleChangeProductName = handleChangeProductName;
    this.proxy = proxy;
    this.stop = stop;
    this.settings = settings;
    this.monitorDelay = this.returnMonitorDelay();
    this.checkoutDelay = options.task.checkoutDelay === '' ? settings.checkoutTime : options.task.checkoutDelay;
    this.cookieJar = cookieJar;
    this.tokenID = uuidv4();
    this.run = run;
    this.index = index;
    this.rp = request.defaults({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
        Cookie: this.cookieJar.getCookieString(stores[options.task.store])
      },
      jar: this.cookieJar,
      proxy:
        this.options.task.proxy === ''
          ? this.proxy !== undefined
            ? `http://${this.proxy.user}:${this.proxy.pass}@${this.proxy.ip}:${this.proxy.port}`
            : ''
          : `http://${this.options.task.proxy}`
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

  findProductWithKeywords = async () => {
    try {
      const keywords = this.keywords;
      const response = await this.rp({
        method: 'GET',
        uri: `${stores[this.options.task.store]}/en-us/men.json?q=${encodeURIComponent(this.keywords.positiveKeywords.join(' '))}`,
        json: true
      });
      const productResultsMale = response.products;
      for (const product of productResultsMale) {
        const productNameArray = `${product.name} ${product.brand}`
          .toLowerCase()
          .split(/[^a-zA-Z0-9']/)
          .filter(elem => elem !== '');
        if (
          _.difference(keywords.positiveKeywords, productNameArray).length === 0 &&
          _.difference(keywords.negativeKeywords, productNameArray).length === keywords.negativeKeywords.length
        ) {
          this.handleChangeProductName(product.name);
          return product;
        }
      }
    } catch (error) {
      return error;
    }
  };

  checkSize = (option, size) => {
    const sizeNames = sizeSynonymns[size];
    if (sizeNames !== undefined) {
      for (const size of sizeNames) {
        if (option.split(' ').includes(size) || option === size) {
          return true;
        }
      }
    } else {
      if (option === size) {
        return true;
      } else if (option.split(' ').includes(size)) {
        return true;
      }
    }
  };

  findSize = async product => {
    try {
      const response = await this.rp({
        method: 'GET',
        uri: `${stores[this.options.task.store]}/en-us${product.url}.json`,
        json: true
      });
      console.log(response);
      const sizes = response.product.sizes;
      for (const size of sizes) {
        if (this.checkSize(size.name, this.options.task.size)) {
          return size;
        }
      }
      throw new Error('no size found');
    } catch (error) {
      return error;
    }
  };

  addToCart = async productSKU => {
    const payload = { sku: productSKU, serviceType: 'product-details', userId: null };
    try {
      const response = await this.rp({
        method: 'POST',
        body: payload,
        json: true,
        uri: `${stores[this.options.task.store]}/en-us/api/shopping-bag/${productSKU}`,
        followAllRedirects: true
      });
      return response;
    } catch (error) {
      return new Error('unable to add to cart');
    }
  };

  login = async () => {
    try {
      const payload = { email: this.options.task.email, password: this.options.task.password };
      const response = await this.rp({
        method: 'POST',
        form: payload,
        uri: `${stores[this.options.task.store]}/en-us/account/login`
      });
      return response;
    } catch (error) {
      return new Error('unable to login');
    }
  };

  getShippingInfo = async () => {
    try {
      const payload = {
        country: countryCodes[this.options.profile.deliveryCountry],
        state: countries[this.options.profile.deliveryCountry].province_codes[this.options.profile.deliveryProvince]
      };
      const response = await this.rp({
        method: 'POST',
        form: payload,
        json: true,
        uri: `${stores[this.options.task.store]}/en-us/checkout/updateshippingmethods`
      });
      return response.availableShippings[0].providerId;
    } catch (error) {
      return new Error('unable to get shipping info');
    }
  };

  getCheckoutBodyInfo = async () => {
    try {
      const response = await this.rp({
        method: 'GET',
        uri: `${stores[this.options.task.store]}/en-us/checkout`
      });
      const $ = cheerio.load(response);
      return {
        CSRFTokenId: $('input[name="CSRFTokenId"]').attr('value'),
        CSRFTokenValue: $('input[name="CSRFTokenValue"]').attr('value'),
        device_fingerprint: $('input[name="device_fingerprint"]').attr('value')
      };
    } catch (error) {
      return new Error('unable to get checkout info');
    }
  };

  sendCheckoutInfo = async (shippingID, checkoutBodyInfo, encryptCardInfo) => {
    try {
      const payload = {
        CSRFTokenId: checkoutBodyInfo.CSRFTokenId,
        CSRFTokenValue: checkoutBodyInfo.CSRFTokenValue,
        shipping_method: `${shippingID}`,
        shipping_id: '',
        shipping_isnew: '1',
        device_fingerprint: checkoutBodyInfo.device_fingerprint,
        shipping_firstname: this.options.profile.deliveryFirstName,
        shipping_lastname: this.options.profile.deliveryLastName,
        shipping_company: '',
        shipping_address: this.options.profile.deliveryAddress,
        shipping_country: countryCodes[this.options.profile.deliveryCountry],
        shipping_state: countries[this.options.profile.deliveryCountry].province_codes[this.options.profile.deliveryProvince],
        shipping_postalcode: this.options.profile.deliveryZip,
        shipping_city: this.options.profile.deliveryCity,
        shipping_phone: this.options.profile.phoneNumber,
        pccc: '',
        paymentMethod: 'creditcard',
        creditcardHolderName: this.options.profile.paymentCardholdersName,
        creditcardNumber: encryptCardInfo.hpciCC,
        creditcardCVV: encryptCardInfo.hpciCVV,
        creditCardMonth: this.options.profile.paymentCardExpiryMonth,
        creditCardYear: this.options.profile.paymentCardExpiryYear,
        billing_id: '',
        billing_isnew: '1',
        billing_firstname: this.options.profile.billingFirstName,
        billing_lastname: this.options.profile.billingLastName,
        billing_company: this.options.profile.billingProvince,
        billing_address: this.options.profile.billingAddress,
        billing_country: countryCodes[this.options.profile.billingCountry],
        billing_state: countries[this.options.profile.billingCountry].province_codes[this.options.profile.billingProvince],
        billing_postalcode: this.options.profile.billingZip,
        billing_city: this.options.profile.billingCity,
        billing_phone: this.options.profile.phoneNumber
      };
      const response = await this.rp({
        method: 'POST',
        form: payload,
        json: true,
        uri: `${stores[this.options.task.store]}/en-us/checkout`,
        followAllRedirects: true
      });
      return response;
    } catch (error) {
      return error;
    }
  };

  encryptCardInfo = async () => {
    const payload = {
      captchaId: '1483778',
      captchaResp: '649237',
      ccNum: this.options.profile.paymentCardnumber,
      ccCVV: this.options.profile.paymentCVV,
      sid: '529081',
      cvvValidate: '',
      enableTokenDisplay: '',
      ccNumTokenIdx: 1,
      ccNumToken: '',
      ccCVVToken: '',
      firstName: '',
      lastName: '',
      expYear: '',
      expMonth: '',
      requestRef: '',
      encryptEnabled: 'N',
      encryptKeyName: ''
    };
    try {
      const response = await this.rp({
        method: 'POST',
        uri: 'https://cc.hostedpci.com/iSynSApp/appUserMapCC!createMapedCC.action',
        form: payload,
        followAllRedirects: true,
        resolveWithFullResponse: true
      });
      let finalResponse = {};
      response.body.split('&').forEach(elem => {
        const splitElem = elem.split('=');
        finalResponse[splitElem[0]] = splitElem[1];
      });
      return finalResponse;
    } catch (error) {
      return new Error('unable to encrypt card info');
    }
  };

  checkout = async () => {
    try {
      const product = await this.findProductWithKeywords();
      const size = await this.findSize(product);
      const addToCartResponse = await this.addToCart(size.sku);
      const [loginResponse, shippingIDResponse, encryptCardInfo] = await Promise.all([this.login(), this.getShippingInfo(), this.encryptCardInfo()]);
      const checkoutBodyInfo = await this.getCheckoutBodyInfo();
      const checkoutResponse = await this.sendCheckoutInfo(shippingIDResponse, checkoutBodyInfo, encryptCardInfo);
      console.log(checkoutResponse);
    } catch (error) {
      this.handleChangeStatus(error.message);
      console.error(error);
    }
  };
}
