import stores from '../store/shops';
const request = require('request-promise');
const cheerio = require('cheerio');

export default class Shopify {
  constructor(options, handleChangeStatus, propertiesHash) {
    this.options = options;
    this.handleChangeStatus = handleChangeStatus;
    this.propertiesHash = propertiesHash;
    this.cookieJar = request.jar();
    this.rp = request.defaults({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.117 Safari/537.36',
        Cookie: this.cookieJar.getCookieString(stores[this.options.task.store])
      },
      jar: this.cookieJar
    });
  }

  returnDomainFromURL(urlstring) {
    const domainArray = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n]+)/im.exec(urlstring);
    return domainArray[1];
  }

  addToCart = async (variantID, amount) => {
    const payload = {
      id: variantID,
      quantity: amount,
      'properties[_hash]': this.propertiesHash
    };
    try {
      const response = await this.rp({
        method: 'POST',
        uri: `${stores[this.options.task.store]}/cart/add.js`,
        form: payload
      });
    } catch (e) {
      console.error(e);
    }
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
    try {
      const response = await this.rp({
        method: 'POST',
        uri: 'https://elb.deposit.shopifycs.com/sessions',
        body: payload,
        json: true
      });
      return response.id;
    } catch (e) {
      console.error(e);
    }
  };

  getCheckoutBody = async checkoutURL => {
    const response = await this.rp({
      method: 'GET',
      uri: `${checkoutURL}?step=payment_method`
    });
    return response;
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

  sendCustomerInfo = async (checkoutURL, authToken) => {
    const payload = {
      utf8: '✓',
      _method: 'patch',
      authenticity_token: authToken,
      previous_step: 'contact_information',
      step: 'shipping_method',
      'checkout[email]': this.options.profile.paymentEmail,
      'checkout[buyer_accepts_marketing]': '0',
      'checkout[shipping_address][first_name]': this.options.profile.deliveryFirstName,
      'checkout[shipping_address][last_name]': this.options.profile.deliveryLastName,
      'checkout[shipping_address][company]': '',
      'checkout[shipping_address][address1]': this.options.profile.deliveryAddress,
      'checkout[shipping_address][address2]': '',
      'checkout[shipping_address][city]': this.options.profile.deliveryCity,
      'checkout[shipping_address][country]': this.options.profile.deliveryCountry,
      'checkout[shipping_address][province]': this.options.profile.deliveryCountry,
      'checkout[shipping_address][zip]': this.options.profile.deliveryZip,
      'checkout[shipping_address][phone]': this.options.profile.phoneNumber,
      'checkout[remember_me]': '0',
      'checkout[client_details][browser_width]': '1710',
      'checkout[client_details][browser_height]': '1289',
      'checkout[client_details][javascript_enabled]': '1',
      button: ''
    };
    try {
      const response = await this.rp({
        method: 'POST',
        uri: checkoutURL,
        followAllRedirects: true,
        resolveWithFullResponse: true,
        form: payload,
        headers: {
          Cookie: this.cookieJar.getCookieString(checkoutURL)
        }
      });
      return response;
    } catch (e) {
      this.handleChangeStatus('Failed Sending Customer Info');
      console.error(e);
    }
  };

  returnPaymentID = paymentBody => {
    const $ = cheerio.load(paymentBody);
    return $('div.section.section--payment-method input').attr('value');
  };

  returnAuthToken = paymentBody => {
    const $ = cheerio.load(paymentBody);
    return $('input[name="authenticity_token"]').attr('value');
  };

  getShippingToken = async () => {
    const payload = {
      shipping_address: {
        zip: this.options.profile.deliveryZip,
        country: this.options.profile.deliveryCountry,
        province: this.options.profile.deliveryProvince
      }
    };
    try {
      const response = await this.rp({
        method: 'POST',
        json: true,
        uri: `${stores[this.options.task.store]}/cart/shipping_rates.json`,
        body: payload
      });
      const shipOpt = response.shipping_rates[0].name.replace(/ /g, '%20');
      const shipPrc = response.shipping_rates[0].price;
      const shippingOption = `shopify-${shipOpt}-${shipPrc}`;
      return shippingOption;
    } catch (e) {
      console.error(e);
    }
  };

  sendShippingMethod = async (shippingToken, checkoutURL) => {
    const payload = {
      utf8: '✓',
      _method: 'patch',
      authenticity_token: '',
      previous_step: 'shipping_method',
      step: 'payment_method',
      'checkout[shipping_rate][id]': shippingToken,
      button: '',
      'checkout[client_details][browser_width]': '1710',
      'checkout[client_details][browser_height]': '1289',
      'checkout[client_details][javascript_enabled]': '1'
    };
    try {
      const response = await this.rp({
        method: 'POST',
        uri: checkoutURL,
        resolveWithFullResponse: true,
        followAllRedirects: true,
        form: payload,
        headers: {
          Cookie: this.cookieJar.getCookieString(checkoutURL)
        }
      });
    } catch (e) {
      console.error(e);
    }
  };

  sendCheckoutInfo = async (paymentToken, shippingToken, paymentID, authToken, checkoutURL) => {
    const payload = {
      utf8: '✓',
      _method: 'patch',
      authenticity_token: authToken,
      previous_step: 'payment_method',
      step: '',
      s: paymentToken,
      'checkout[payment_gateway]': paymentID,
      'checkout[credit_card][vault]': 'false',
      'checkout[different_billing_address]': 'true',
      'checkout[billing_address][first_name]': this.options.profile.billingFirstName,
      'checkout[billing_address][last_name]': this.options.profile.billingLastName,
      'checkout[billing_address][address1]': this.options.profile.billingAddress,
      'checkout[billing_address][address2]': '',
      'checkout[billing_address][city]': this.options.profile.billingCity,
      'checkout[billing_address][country]': this.options.profile.billingCountry,
      'checkout[billing_address][province]': this.options.profile.billingProvince,
      'checkout[billing_address][zip]': this.options.profile.billingZip,
      'checkout[billing_address][phone]': this.options.profile.phoneNumber,
      'checkout[shipping_rate][id]': shippingToken,
      complete: '1',
      'checkout[client_details][browser_width]': (Math.floor(Math.random() * 2000) + 1000).toString(),
      'checkout[client_details][browser_height]': (Math.floor(Math.random() * 2000) + 1000).toString(),
      'checkout[client_details][javascript_enabled]': '1',
      'checkout[total_price]': '4300',
      button: ''
    };
    try {
      const response = await this.rp({
        method: 'POST',
        uri: checkoutURL,
        form: payload,
        resolveWithFullResponse: true,
        followAllRedirects: true,
        headers: {
          Cookie: this.cookieJar.getCookieString(checkoutURL)
        }
      });
      console.log(response);
      return response;
    } catch (e) {
      console.error(e);
    }
  };

  checkoutPoll = async checkoutURL => {
    try {
      await this.rp({
        method: 'GET',
        url: `${checkoutURL}/throttle/queue?js_poll=1`
      });
    } catch (e) {
      console.error(e);
    }
  };

  checkoutWithVariant = async variantID => {
    const start = Date.now();
    await this.addToCart(variantID, this.options.task.quantity);
    // await this.checkoutPoll(checkoutURL);
    const [paymentToken, checkoutURL, shippingToken] = await Promise.all([this.generatePaymentToken(), this.getCheckoutUrl(), this.getShippingToken()]);
    const checkoutBody = this.getCheckoutBody(checkoutURL);
    const paymentID = this.returnPaymentID(checkoutBody);
    const authToken = this.returnAuthToken(checkoutBody);
    await Promise.all([this.sendCustomerInfo(checkoutURL, authToken), this.sendShippingMethod(shippingToken, checkoutURL)]);
    await this.sendCheckoutInfo(paymentToken, shippingToken, paymentID, authToken, checkoutURL);
    console.log(Date.now() - start);
  };
}
