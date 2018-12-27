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
export default class Overkill {
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
    console.log(stores[options.task.store]);
    this.rp = request.defaults({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36'
        // Cookie: this.cookieJar.getCookieString(stores[options.task.store])
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
      console.log(
        `https://www.overkillshop.com/autocomplete.php?store=en&currency=EUR&fallback_url=https://www.overkillshop.com/en/catalogsearch/ajax/suggest/&q=${encodeURIComponent(
          this.keywords.positiveKeywords.join(' ')
        )}`
      );
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
        console.log(item);
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
      console.log(error);
      return error;
    }
  };

  addToCart = async atcInfo => {
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

    let response = await this.rp({
      method: 'POST',
      uri: 'https://www.overkillshop.com/en/gomageprocart/procart/changeattributecart/',
      form: payload,
      followAllRedirects: true
    });

    const payload1 = {
      method: 'guest'
    };
    await this.rp({
      method: 'POST',
      uri: 'https://www.overkillshop.com/en/checkout/onepage/saveMethod/',
      form: payload1
      // headers: {
      //   cookie: this.cookieJar.getCookieString(stores[this.options.task.store])
      // }
    });

    const payload2 = {
      'billing[address_id]': '',
      'billing[firstname]': this.options.profile.billingFirstName,
      'billing[lastname]': this.options.profile.billingLastName,
      'billing[company]': '',
      'billing[street][]': this.options.profile.billingAddress,
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
      'billing[use_for_shipping]': '0'
    };
    await this.rp({
      method: 'POST',
      uri: 'https://www.overkillshop.com/en/checkout/onepage/saveBilling/',
      form: payload2
    });

    const payload3 = {
      'shipping[address_id]': '',
      'shipping[firstname]': this.options.profile.deliveryFirstName,
      'shipping[lastname]': this.options.profile.deliveryLastName,
      'shipping[company]': '',
      'shipping[street][]': this.options.profile.deliveryAddress,
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
      'shipping[save_in_address_book]': '1'
    };
    await this.rp({
      method: 'POST',
      uri: 'https://www.overkillshop.com/en/checkout/onepage/saveShipping/',
      form: payload3
    });

    const payload4 = {
      shipping_method: 'owebiashipping4_europe'
    };
    await this.rp({
      method: 'POST',
      uri: 'https://www.overkillshop.com/en/checkout/onepage/saveShippingMethod/',
      form: payload4
    });

    const payload5 = {
      'payment[method]': 'vrpayecommerce_creditcard'
    };
    await this.rp({
      method: 'POST',
      uri: 'https://www.overkillshop.com/en/checkout/onepage/savePayment/',
      form: payload5
    });

    const payload6 = {
      'payment[method]': 'vrpayecommerce_creditcard',
      'ordercomment[comment]': '',
      'agreement[5]': '1'
    };
    response = await this.rp({
      method: 'POST',
      uri: `https://www.overkillshop.com/en/checkout/onepage/saveOrder/form_key/${formKey}/`,
      form: payload6
    });
    console.log(response);
  };

  checkout = async () => {
    try {
      const product = await this.findProductWithKeywords();
      console.log(product);
      const sizeInfo = await this.getSizes(product);
      console.log(sizeInfo);
      const addToCartResponse = await this.addToCart(sizeInfo);
      console.log(addToCartResponse);
      await this.getShippingInfo();
      //   await this.sendEmail();
      // await this.sendAddress();
      // await this.setMethods();
      // await this.saveBilling();
      const sendCheckoutInfoResponse = await this.sendCheckoutInfo();
      //   console.log(sendCheckoutInfoResponse);
      //   const paymentPageResponse = await this.getPaymentPage();
      //   console.log(paymentPageResponse);
      //   const [loginResponse, shippingIDResponse, encryptCardInfo] = await Promise.all([this.login(), this.getShippingInfo(), this.encryptCardInfo()]);
      //   const checkoutBodyInfo = await this.getCheckoutBodyInfo();
      //   const checkoutResponse = await this.sendCheckoutInfo(shippingIDResponse, checkoutBodyInfo, encryptCardInfo);
      //   console.log(checkoutResponse);
    } catch (error) {
      this.handleChangeStatus(error.message);
      console.error(error);
    }
  };
}
