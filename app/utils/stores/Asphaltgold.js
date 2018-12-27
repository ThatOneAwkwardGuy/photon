const request = require('request-promise');
const _ = require('lodash');
const ipcRenderer = require('electron').ipcRenderer;
const cheerio = require('cheerio');
const uuidv4 = require('uuid/v4');
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
export default class Asphaltgold {
  constructor(options, keywords, handleChangeStatus, handleChangeProductName, proxy, stop, cookieJar, settings, run) {
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
        uri: `${stores[this.options.task.store]}/ff_suggest/proxy/suggest/?query=${encodeURIComponent(this.keywords.positiveKeywords.join(' '))}&format=JSONP`,
        json: true
      });
      const products = JSON.parse(response.substring(1, response.length - 2));
      const productsResults = products.suggestions.filter(elem => elem.attributes.deeplink !== undefined);
      for (const product of productsResults) {
        const productNameArray = product.name
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

  getSizes = async productLink => {
    this.handleChangeStatus('Getting Size');
    try {
      const options = this.options;
      const checkSize = this.checkSize;
      const response = await this.rp({
        method: 'GET',
        uri: productLink
      });
      const $ = cheerio.load(response);
      const formLink = $('#product_addtocart_form')
        .attr('action')
        .replace('checkout/cart', 'ajax/index');
      const formKey = $('input[name="form_key"]').attr('value');
      const productID = $('input[name="product"]').attr('value');
      const selectValue = $('.product-options select').attr('name');
      let size = '';
      const listItems = $('.product-options li').each(function(index, element) {
        const productSize = $(element);
        if (productSize.attr('data-simplesku') !== undefined) {
          if (checkSize(productSize.first().text(), options.task.size)) {
            const sizeArray = productSize.attr('id').split('_');
            size = sizeArray[sizeArray.length - 1];
            return;
          }
        }
      });
      return {
        size,
        formLink,
        formKey,
        productID,
        selectValue
      };
    } catch (error) {
      return error;
    }
  };

  addToCart = async atcInfo => {
    this.handleChangeStatus('Adding To Cart');
    try {
      const selectValue = atcInfo.selectValue;
      const payload = {
        form_key: atcInfo.formKey,
        product: atcInfo.productID,
        related_product: '',
        [selectValue]: atcInfo.size,
        qty: 1,
        isAjax: 1
      };
      const response = await this.rp({
        method: 'POST',
        form: payload,
        uri: atcInfo.formLink
      });
      return response;
    } catch (error) {
      return error;
    }
  };

  sendCheckoutInfo = async () => {
    this.handleChangeStatus('Sending Checkout');
    try {
      const payload = `billing[firstname]=${this.options.profile.billingFirstName}&billing[lastname]=${this.options.profile.billingLastName}&billing[email]=${
        this.options.profile.paymentEmail
      }&billing[telephone]=${this.options.profile.phoneNumber}&billing[company]=&billing[street][]=${this.options.profile.billingAddress}&billing[street][]=${
        this.options.profile.billingAptorSuite
      }&billing[street][]=&billing[postcode]=${this.options.profile.billingZip}&billing[city]=${
        this.options.profile.billingCity
      }&billing[region_id]=&billing[region]=${this.options.profile.billingProvince}&billing[country_id]=${
        countries[this.options.profile.deliveryCountry].code
      }&billing[customer_password]=&billing[confirm_password]=&billing[save_in_address_book]=1&shipping[firstname]=${
        this.options.profile.deliveryFirstName
      }&shipping[lastname]=${this.options.profile.deliveryLastName}&shipping[telephone]=${
        this.options.profile.phoneNumber
      }&shipping[company]=&shipping[street][]=${this.options.profile.deliveryAddress}&shipping[street][]=${
        this.options.profile.deliveryAptorSuite
      }&shipping[street][]=&shipping[postcode]=${this.options.profile.deliveryZip}&shipping[city]=${
        this.options.profile.deliveryCity
      }&shipping[region_id]=&shipping[region]=${this.options.profile.deliveryProvince}&shipping[country_id]=${
        countries[this.options.profile.deliveryCountry].code
      }&shipping[save_in_address_book]=1&shipping[address_id]=4693213&shipping_method=premiumrate_UPS&payment[method]=telecashipg_creditcard&onestepcheckout-couponcode=&onestepcheckout_comments=&agreement[4]=1&agreement[5]=1`;

      const response = await this.rp({
        method: 'POST',
        body: payload
          .replace(/\[/g, '%5B')
          .replace(/]/g, '%5D')
          .replace(/@/g, '%40')
          .replace(/\s/g, '+'),
        uri: 'https://asphaltgold.de/en/onestepcheckout/',
        headers: {
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'accept-language': 'en-US,en;q=0.9',
          'cache-control': 'no-cache',
          'content-type': 'application/x-www-form-urlencoded',
          pragma: 'no-cache',
          'upgrade-insecure-requests': '1',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36'
        },
        followAllRedirects: true,
        resolveWithFullResponse: true
      });
      return response;
    } catch (error) {
      return error;
    }
  };

  getPaymentPage = async () => {
    try {
      const response = await this.rp({
        method: 'GET',
        headers: {
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'accept-language': 'en-US,en;q=0.9',
          'cache-control': 'no-cache',
          pragma: 'no-cache',
          'upgrade-insecure-requests': '1',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36'
        },
        uri: 'https://asphaltgold.de/en/telecashipg/creditcard/redirect/',
        resolveWithFullResponse: true
      });
      return response;
    } catch (error) {
      return error;
    }
  };

  submitPaymentForm = async formBody => {
    const $ = cheerio.load(formBody);
    const payload = {};
    $('form input').each((index, element) => {
      const input = $(element);
      payload[input.attr('name')] = input.attr('value');
    });
    console.log(payload);
    const response = await this.rp({
      method: 'POST',
      uri: 'https://www.ipg-online.com/connect/gateway/processing',
      form: payload,
      resolveWithFullResponse: true,
      followAllRedirects: true
    });
    return response;
  };

  submitPayment = async paymentBody => {
    this.handleChangeStatus('Submitting Payment');
    const $ = cheerio.load(paymentBody);
    const payload = {
      bname: `${this.options.profile.billingFirstName} ${this.options.profile.billingLastName}`,
      cardnumber: this.options.profile.paymentCardnumber.match(/.{1,4}/g).join(' '),
      expmonth: this.options.profile.paymentCardExpiryMonth.substr(-1),
      expyear: this.options.profile.paymentCardExpiryYear.substr(-1),
      cvm_masked: '***',
      cvm: this.options.profile.paymentCVV,
      'org.apache.myfaces.trinidad.faces.FORM': 'cciForm',
      _noJavaScript: false,
      'javax.faces.ViewState': $('[name="javax.faces.ViewState"]').attr('value'),
      source: 'cancel'
    };
    const response = await this.rp({
      method: 'POST',
      form: payload,
      uri: 'https://www.ipg-online.com/connect/gateway/processing?execution=e1s1',
      resolveWithFullResponse: true
    });
    if (response.body.includes('Cancelled')) {
      this.handleChangeStatus('Payment Failed');
    } else {
      this.handleChangeStatus('Check Email');
    }
    this.stop(true);
    return response;
  };

  checkoutWithKeywords = async () => {
    try {
      const product = await this.findProductWithKeywords();
      const sizeInfo = await this.getSizes(product.attributes.deeplink);
      await this.addToCart(sizeInfo);
      const sendCheckoutInfoResponse = await this.sendCheckoutInfo();
      const paymentPageResponse = await this.getPaymentPage();
      const submitPaymentFormResponse = await this.submitPaymentForm(paymentPageResponse.body);
      const submitPaymentResponse = await this.submitPayment(submitPaymentFormResponse.body);
      console.log(submitPaymentResponse);
    } catch (error) {
      this.handleChangeStatus(error.message);
      console.error(error);
    }
  };

  checkoutWithLink = async () => {
    try {
      const sizeInfo = await this.getSizes(this.options.task.modeInput);
      await this.addToCart(sizeInfo);
      await this.sendCheckoutInfo();
      const paymentPageResponse = await this.getPaymentPage();
      const submitPaymentFormResponse = await this.submitPaymentForm(paymentPageResponse.body);
      const submitPaymentResponse = await this.submitPayment(submitPaymentFormResponse.body);
      console.log(submitPaymentResponse);
    } catch (error) {
      this.handleChangeStatus(error.message);
      this.stop(true);
      console.error(error);
    }
  };
}
