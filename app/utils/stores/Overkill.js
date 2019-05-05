const request = require('request-promise');
const _ = require('lodash');
const ipcRenderer = require('electron').ipcRenderer;
const cheerio = require('cheerio');
const uuidv4 = require('uuid/v4');
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();
const log = require('electron-log');
import stores from '../../store/shops';
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
export default class Overkill {
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
    console.log(stores[options.task.store]);
    this.rp = request.defaults({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36'
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

  findProductWithKeywords = async () => {
    log.info(`[Task - ${this.index + 1}] - Finding Product`);
    try {
      const checkSize = this.checkSize;
      const options = this.options;
      const keywords = this.keywords;
      const response = await this.rp({
        method: 'GET',
        uri: `https://www.overkillshop.com/autocomplete.php?store=en&currency=EUR&fallback_url=https://www.overkillshop.com/en/catalogsearch/ajax/suggest/&q=${encodeURIComponent(
          this.keywords.positiveKeywords.join(' ')
        )}`
      });
      let productLink = '';
      const $ = cheerio.load(response);
      $('a').each((index, element) => {
        const productSuggestion = $(element);
        const productName = productSuggestion.text();
        const productNameArray = productName
          .toLowerCase()
          .split(/[^a-zA-Z0-9']/)
          .filter(elem => elem !== '');
        if (
          _.difference(keywords.positiveKeywords, productNameArray).length === 0 &&
          _.difference(keywords.negativeKeywords, productNameArray).length === keywords.negativeKeywords.length
        ) {
          this.handleChangeProductName(productName);
          productLink = productSuggestion.attr('href');
          return;
        }
      });
      return productLink;
    } catch (error) {
      return error;
    }
  };

  getSizes = async productLink => {
    log.info(`[Task - ${this.index + 1}] - Getting Available Sizes`);
    try {
      const options = this.options;
      const checkSize = this.checkSize;
      const response = await this.rp({
        method: 'GET',
        uri: `http:${productLink}`
      });
      const $ = cheerio.load(response);
      const formLink = $('#product_addtocart_form').attr('action');
      const productID = $('input[name="product"]').attr('value');
      const selectValue = $('.row-fluid.required-entry.super-attribute-select').attr('name');
      let size = '';
      const listItems = JSON.parse(response.match(/new Product.Config\(([^)]+)\)/)[1]).attributes[150].options;
      for (const item of listItems) {
        if (checkSize(item.label, options.task.size)) {
          size = item.id;
          break;
        }
      }
      return {
        size,
        formLink,
        productID,
        selectValue
      };
    } catch (error) {
      return error;
    }
  };

  addToCart = async atcInfo => {
    log.info(`[Task - ${this.index + 1}] - Adding To Cart`);
    try {
      const selectValue = atcInfo.selectValue;
      const payload = {
        product: atcInfo.productID,
        related_product: '',
        [selectValue]: atcInfo.size,
        qty: '1',
        gpc_add: '1'
      };
      const response = await this.rp({
        method: 'POST',
        form: payload,
        uri: atcInfo.formLink,
        resolveWithFullResponse: true
      });
      return response;
    } catch (error) {
      return error;
    }
  };

  getShippingInfo = async () => {
    log.info(`[Task - ${this.index + 1}] - Getting Shipping Info`);
    try {
      const payload = {
        country_id: countries[this.options.profile.deliveryCountry].code,
        region_id: '',
        region: this.options.profile.deliveryProvince
      };
      const response = await this.rp({
        method: 'POST',
        uri: 'https://www.overkillshop.com/en/checkout/cart/estimatePost/',
        form: payload
      });
      return response;
    } catch (error) {
      return error;
    }
  };

  sendCheckoutInfo = async () => {
    log.info(`[Task - ${this.index + 1}] - Sending Checkout Info`);
    try {
      const bodyResponse = await this.rp({
        method: 'GET',
        uri: 'https://www.overkillshop.com/en/checkout/cart/'
      });

      const formKey = cheerio
        .load(bodyResponse)('input[name="form_key"]')
        .attr('value');

      const payload = {
        cart: '1',
        sidebar: '1'
      };
      let response1 = await this.rp({
        method: 'POST',
        uri: 'https://www.overkillshop.com/en/gomageprocart/procart/changeattributecart/',
        form: payload,
        followAllRedirects: true
      });

      await this.rp({
        method: 'GET',
        uri: 'https://www.overkillshop.com/en/checkout/onepage/'
      });

      const payload2 = {
        'billing[address_id]': '',
        'billing[firstname]': this.options.profile.billingFirstName,
        'billing[lastname]': this.options.profile.billingLastName,
        'billing[company]': '',
        'billing[street_number]': this.options.profile.billingAptorSuite,
        'billing[street][]': '',
        'billing[street][]': '',
        'billing[postcode]': this.options.profile.billingZip,
        'billing[region_id]': '',
        'billing[region]': '',
        'billing[city]': this.options.profile.billingCity,
        'billing[country_id]': countries[this.options.profile.deliveryCountry].code,
        'billing[email]': this.options.profile.paymentEmail,
        'billing[telephone]': this.options.profile.phoneNumber,
        'billing[fax]': '',
        'billing[customer_password]': '',
        'billing[confirm_password]': '',
        'billing[save_in_address_book]': '1',
        'billing[use_for_shipping]': '0',
        'billing[street][]': this.options.profile.billingAddress
      };
      const response2 = await this.rp({
        method: 'POST',
        uri: 'https://www.overkillshop.com/en/checkout/onepage/saveBilling/',
        form: payload2
      });

      const payload3 = {
        'shipping[address_id]': '',
        'shipping[firstname]': this.options.profile.deliveryFirstName,
        'shipping[lastname]': this.options.profile.deliveryLastName,
        'shipping[company]': '',
        'shipping[street_number]': this.options.profile.deliveryAptorSuite,
        'shipping[street][]': '',
        'shipping[street][]': '',
        'shipping[postcode]': this.options.profile.deliveryZip,
        'shipping[region_id]': '',
        'shipping[region]': this.options.profile.deliveryProvince,
        'shipping[city]': this.options.profile.deliveryCity,
        'shipping[country_id]': countries[this.options.profile.deliveryCountry].code,
        'shipping[telephone]': this.options.profile.phoneNumber,
        'shipping[fax]': '',
        'shipping[save_in_address_book]': '1',
        'shipping[street][]': this.options.profile.deliveryAddress
      };
      const response3 = await this.rp({
        method: 'POST',
        uri: 'https://www.overkillshop.com/en/checkout/onepage/saveShipping/',
        form: payload3
      });

      const payload4 = {
        shipping_method: 'owebiashipping4_europe'
      };
      const response4 = await this.rp({
        method: 'POST',
        uri: 'https://www.overkillshop.com/en/checkout/onepage/saveShippingMethod/',
        form: payload4
      });

      const payload5 = {
        'payment[method]': 'vrpayecommerce_creditcard'
      };
      const response5 = await this.rp({
        method: 'POST',
        uri: 'https://www.overkillshop.com/en/checkout/onepage/savePayment/',
        form: payload5
      });

      const payload6 = {
        'payment[method]': 'vrpayecommerce_creditcard',
        'ordercomment[comment]': '',
        'agreement[5]': '1'
      };
      const response6 = await this.rp({
        method: 'POST',
        json: true,
        uri: `https://www.overkillshop.com/en/checkout/onepage/saveOrder/form_key/${formKey}/`,
        form: payload6
      });
      return response6;
    } catch (error) {
      return error;
    }
  };

  getPaymentPage = async url => {
    log.info(`[Task - ${this.index + 1}] - Getting Payment Page`);
    try {
      const response = await this.rp({
        method: 'GET',
        uri: url,
        resolveWithFullResponse: true
      });
      return response.body;
    } catch (error) {
      return error;
    }
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

  postCardInfo = async body => {
    log.info(`[Task - ${this.index + 1}] - Sending Card Info`);
    try {
      const code = body.split('"').find(elem => elem.includes('https://oppwa.com/'));
      const url = `https://oppwa.com/v1/checkouts/${code.split('=')[1]}`;

      const response = await this.rp({
        method: 'GET',
        uri: `https://oppwa.com/v1/pciIframe.html?checkoutId=${code.split('=')[1]}`
      });

      const $ = cheerio.load(response);
      const shopperEndToEnd = $('input[name="customParameters[SHOPPER_EndToEndIdentity]"]').attr('value');

      const payload1 = {
        'card.number': this.options.profile.paymentCardnumber,
        'customParameters[SHOPPER_EndToEndIdentity]': shopperEndToEnd
      };
      const response1 = await this.rp({
        method: 'POST',
        uri: url,
        form: payload1,
        resolveWithFullResponse: true
      });

      const payload2 = {
        'card.cvv': this.options.profile.paymentCVV
      };
      const response2 = await this.rp({
        method: 'POST',
        uri: url,
        form: payload2,
        resolveWithFullResponse: true
      });

      const payload3 = {
        paymentBrand: this.getCardType(this.options.profile.paymentCardnumber).toUpperCase(),
        'card.holder': this.options.profile.paymentCardholdersName,
        shopperResultUrl: 'https://www.overkillshop.com/en/vrpayecommerce/response/handleResponse/pm/vrpayecommerce_creditcard/',
        forceUtf8: '&#9760;',
        'card.expiryMonth': this.options.profile.paymentCardExpiryMonth,
        'card.expiryYear': this.options.profile.paymentCardExpiryYear,
        shopOrigin: 'https://www.overkillshop.com'
      };
      const response3 = await this.rp({
        method: 'POST',
        uri: `${url}/payment`,
        form: payload3,
        resolveWithFullResponse: true,
        followAllRedirects: true
      });
      return response3.body;
    } catch (error) {
      return error;
    }
  };

  postMore = async body => {
    log.info(`[Task - ${this.index + 1}] - Sending Checkout Gateway Info`);
    try {
      const $ = cheerio.load(body);
      const MD = $('input[name="MD"]').attr('value');
      const TermUrl = $('input[name="TermUrl"]').attr('value');
      const PaReq = $('input[name="PaReq"]').attr('value');
      const payload = {
        MD: MD,
        TermUrl: TermUrl,
        PaReq: PaReq
      };
      const response = await this.rp({
        method: 'POST',
        url: 'https://cap.attempts.securecode.com/acspage/cap?RID=14&VAA=A',
        form: payload
      });

      const $1 = cheerio.load(response);
      const PaRes = $1('input[name="PaRes"]').attr('value');
      const MD1 = $1('input[name="MD"]').attr('value');
      const PaReq1 = $1('input[name="PaReq"]').attr('value');
      const ABSlog = $1('input[name="ABSlog"]').attr('value');
      const deviceDNA = $1('input[name="deviceDNA"]').attr('value');
      const executionTime = $1('input[name="executionTime"]').attr('value');
      const dnaError = $1('input[name="dnaError"]').attr('value');
      const mesc = $1('input[name="mesc"]').attr('value');
      const mescIterationCount = $1('input[name="mescIterationCount"]').attr('value');
      const desc = $1('input[name="desc"]').attr('value');
      const isDNADone = $1('input[name="isDNADone"]').attr('value');
      const arcotFlashCookie = $1('input[name="arcotFlashCookie"]').attr('value');

      const payload2 = {
        PaRes: PaRes,
        MD: MD1,
        PaReq: PaReq1,
        ABSlog: ABSlog,
        deviceDNA: deviceDNA,
        executionTime: executionTime,
        dnaError: dnaError,
        mesc: mesc,
        mescIterationCount: mescIterationCount,
        desc: desc,
        isDNADone: isDNADone,
        arcotFlashCookie: arcotFlashCookie
      };
      const response2 = await this.rp({
        method: 'POST',
        url: $1('form[name="downloadForm"]').attr('action'),
        form: payload2
      });

      const $2 = cheerio.load(response2);
      const payload3 = {
        response: 'null',
        threedsecure_verificationpath: 'null'
      };
      const response3 = await this.rp({
        method: 'POST',
        url: $2('form[name="redirectToMerchant"]').attr('action'),
        form: payload3
      });
    } catch (error) {
      return error;
    }
  };

  checkoutWithKeywords = async () => {
    try {
      const product = await this.findProductWithKeywords();
      const sizeInfo = await this.getSizes(product);
      const addToCartResponse = await this.addToCart(sizeInfo);
      await this.getShippingInfo();
      const sendCheckoutInfoResponse = await this.sendCheckoutInfo();
      const paymentPageResponse = await this.getPaymentPage(sendCheckoutInfoResponse.redirect);
      const postCardInfoResponse = await this.postCardInfo(paymentPageResponse);
      await this.postMore(postCardInfoResponse);
    } catch (error) {
      this.handleChangeStatus(error.message);
      log.error(`[Task - ${this.index + 1}] -  ${error.message}`);
      console.error(error);
    }
  };

  checkoutWithURL = async product => {
    try {
      const sizeInfo = await this.getSizes(product.split('https:')[1]);
      const addToCartResponse = await this.addToCart(sizeInfo);
      await this.getShippingInfo();
      const sendCheckoutInfoResponse = await this.sendCheckoutInfo();
      const paymentPageResponse = await this.getPaymentPage(sendCheckoutInfoResponse.redirect);
      const postCardInfoResponse = await this.postCardInfo(paymentPageResponse);
      await this.postMore(postCardInfoResponse);
    } catch (error) {
      this.handleChangeStatus(error.message);
      log.error(`[Task - ${this.index + 1}] -  ${error.message}`);
      console.error(error);
    }
  };
}
