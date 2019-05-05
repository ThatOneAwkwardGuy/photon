const request = require('request-promise');
const _ = require('lodash');
const cheerio = require('cheerio');
const uuidv4 = require('uuid/v4');
const log = require('electron-log');
import stores from '../../store/shops';
import countryCodes from '../../store/countryCodes';
import countries from '../../store/countries';
import { async } from 'q';
const sizeSynonymns = {
  XSmall: ['XSMALL', 'XS', 'XSmall', 'X-Small'],
  Small: ['SMALL', 'S', 'Small'],
  Medium: ['Medium', 'M', 'MEDIUM', 'Med', 'MED'],
  Large: ['LARGE', 'L', 'Large'],
  XLarge: ['XLARGE', 'X-Large', 'X-LARGE', 'XL'],
  XXLarge: ['XXLARGE', 'XX-Large', 'XXL', 'XX-LARGE'],
  'N/A': ['N/A', 'Default Title', 'One Size']
};
export default class SOTOStore {
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
    log.info(`[Task - ${this.index + 1}] - Finding Product With Keywords`);
    try {
      const keywords = this.keywords;
      const response = await this.rp({
        method: 'GET',
        uri: `${stores[this.options.task.store]}/en/instantsearch/all?q=${encodeURIComponent(this.keywords.positiveKeywords.join(' '))}&offset=0&limit=25`
      });
      let productLink = '';
      const $ = cheerio.load(response);
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
    log.info(`[Task - ${this.index + 1}] - Getting Sizes`);
    try {
      const options = this.options;
      const checkSize = this.checkSize;
      const response = await this.rp({
        method: 'GET',
        uri: productLink
      });
      const $ = cheerio.load(response, { xmlMode: true });
      const sizeInfo = JSON.parse($('#product-form-data')[0].children[0].data).products;
      console.log(JSON.parse($('#product-form-data')[0].children[0].data));
      let size = '';
      for (const item in sizeInfo) {
        if (checkSize(sizeInfo[item].name, options.task.size)) {
          size = sizeInfo[item].id;
          break;
        }
      }
      return {
        size
      };
    } catch (error) {
      console.log(error);
      return error;
    }
  };

  addToCart = async atcInfo => {
    log.info(`[Task - ${this.index + 1}] - Adding To Cart`);
    try {
      const payload = {
        id: atcInfo.size,
        partial: 'ajax-cart'
      };
      const response = await this.rp({
        method: 'POST',
        uri: `${stores[this.options.task.store]}/cart/add`,
        form: payload,
        followAllRedirects: true,
        resolveWithFullResponse: true
      });
      console.log(response);
      return response;
    } catch (error) {
      console.log(error);
      return error;
    }
  };

  checkout = async checkoutBody => {
    log.info(`[Task - ${this.index + 1}] - Checking Out`);
    const $ = cheerio.load(checkoutBody);
    const checkoutToken = $('input[name="_AntiCsrfToken"]').attr('value');
    const payload = {
      _AntiCsrfToken: checkoutToken,
      country: countries[this.options.profile.deliveryCountry].code,
      emailAddress: this.options.profile.paymentEmail,
      postalCodeQuery: '',
      firstName: this.options.profile.deliveryFirstName,
      lastName: this.options.profile.deliveryLastName,
      addressLine2: this.options.profile.deliveryAddress,
      addressLine3: '',
      postalCode: this.options.profile.deliveryZip,
      city: this.options.profile.deliveryCity,
      phoneNumber: this.options.profile.phoneNumber,
      termsAccepted: 'true'
    };
    const response = this.rp({
      method: 'POST',
      form: payload,
      followAllRedirects: true,
      uri: `${stores[this.options.task.store]}/en/cart/process`
    });
  };

  setShipping = async () => {
    log.info(`[Task - ${this.index + 1}] - Setting Shipping`);
    const payload = {
      id: '76',
      partial: 'ajax-cart'
    };
    const respose = await this.rp({
      method: 'POST',
      form: payload,
      followAllRedirects: true,
      uri: `${stores[this.options.task.store]}/en/cart/setshippingmethod`
    });
  };

  submitPaymentInfo = urlData => {
    log.info(`[Task - ${this.index + 1}] - Submitting Payment Info`);
    const payload = {
      displayGroup: 'card',
      'card.cardNumber': '5391+2320+9964+0190',
      'card.cardHolderName': 'Moyosoreoluwa+George',
      'card.expiryMonth': '06',
      'card.expiryYear': '2023',
      'card.cvcCode': '314',
      sig: 'fe09The4JK9QyiPYt9746cQUq0Y=',
      merchantReference: '116599',
      brandCode: 'brandCodeUndef',
      paymentAmount: '14290',
      currencyCode: 'EUR',
      shipBeforeDate: '2019-01-14T05:44:02Z',
      skinCode: 'dbZ9AshK',
      merchantAccount: 'Sotostore',
      shopperLocale: 'en',
      stage: 'pay',
      sessionId: 'ZIUg0Dv8Bt/KY4zkS6IMVzqgFraA9IVMh3ySlFiHLyA=',
      orderData:
        'H4sIAAAAAAAEAKWQzQrCMBCE74LvsORef9CDQg304MmDxbYPkCYrBGpSky2lPr2JVPBgD+Lt253ZZZiURN0gyEZ4f2DWKXSJJrx5xuczgJRqq4YXxsGNFFm9jxR66XRL2hrGM2kQCuqUth5O2Ngeyt4mpY1rKdwVzpH0A9MlqW/v7p0wpGlgfD1laZ2WGPTNDo7V5cMV0P0QtsoLyKRE7yG32tD/kbaL/WoqU4CxzECxdf4EzRK1r30BAAA=',
      sessionValidity: '2019-01-07T05:54:02Z',
      countryCode: 'GB',
      shopperEmail: 'moyogeorge@outlook.com',
      shopperReference: '134858',
      merchantOrderReference: '66647',
      resURL: 'https://www.sotostore.com/adyen/return',
      allowedMethods: 'card',
      originalSession:
        'H4sIAAAAAAAAAI1UXZOiOBT9K1289rQCoqhVUzV+DbOtoGKr3ZYvEQJkDQSToOLU/vdNRGdQZ2bXN+859+R+nMt3BSWIzzgIodJWUpArnxQKA0gppHN3JGIR5ylrr6vr6uFwqDDCCeOEwopH4nUVJuuqByhfV/cIHkQui0iaQjoiHsBSESZnQfY/tICfSzkKeUZllkeyhNO8R3wpZHVFSNQXw4R3Ygkpbc3QW6ogZqLaxLsyB3P3XAhKuzAQ6n3AZVhXtdaLqr1oxptabxtGW9VXghdD6kUg4a5sWqhIqqY16q2WFNmi5KLqb1atDouGpZSO5xV1KLNrJwIl1IdUvAlE/JvB/uoUv0FnuJyeprRnd3sD0xjt2Vg82er1p2FNNey4f9x8TLa9D9q10tk21/GE6q+LSTfsP4+4Xq+tVis0dx01zAcrI9D7y+H77PWVHuvHzDuFr+5uZ3y8H5nlfP0at/4+uo3GuzvSI2rZ+nbay3ZzHtXHuhPCnBtx+qHRoX9YnNJvaqdl491SLNBM1UNq4TDoaxis9KU1eXP6xFzUPXuhTtQpZ2SUD92BmVs1nffX1e0GjNbVJdnNjd7xNOgd/cAYnNyhRmtqV7T8WU4QMoZIsgAY+YjnpT2optxD/bqHi3EGMUBYsGKSkxASGsIvJOOYkK00yU/ezbpqRrPeLC1mLFdQZjQaDcM8G1F6BSVhjwhrAU/sLskw/qQAjMkB+jbkEfGZyBCm9kXCBhNvW4oX7EsN4mo4lH68xn96SVq48ECBkCBg8AevsMrlzwZhLCrq+L44E/aWp7Jg8bQPMdpDmt8AN++XQ2I4KUjycuhWuMI4hbIExTCeulQMFD65BJybvCVGJGPQyeINpGPqgPhSz4OcaH5MJ5TsUTHkR04qjgLgywG5tmY+1bvOI80rjGFRkLNfoMVn4PoJuBvLH9q6Z/6mr0fBXzR2T/pdZ/e8u9Ye4NveLnutBIgyfqnQFodQglASoOOdDyoY/KBb55spJYQwEccgkLkzdMZLpwT5stGgiyiP+iAfB7Y4iuheu0T6L/wDAnoPc4hhGpHkMnhRh2noptFsmueDvNIY8RDAM3meYmJXbiFFEduKV0DlOr3iGoVUlrIXBryUlG5/hkKBrLbPeXNjW9puQKcx2T9r/tsqXI7B++JoT9x11aqZ+3qMhk42/az88y/YJCncBgcAAA==:bGl2ZS5hZHllbi5jb20=',
      'billingAddress.street': '44+Brooke+Road',
      'billingAddress.houseNumberOrName': '',
      'billingAddress.city': 'Grays',
      'billingAddress.postalCode': 'RM17+5BN',
      'billingAddress.stateOrProvince': '',
      'billingAddress.country': 'GB',
      billingAddressType: '',
      'deliveryAddress.street': '44+Brooke+Road',
      'deliveryAddress.houseNumberOrName': '',
      'deliveryAddress.city': 'Grays',
      'deliveryAddress.postalCode': 'RM17+5BN',
      'deliveryAddress.stateOrProvince': '',
      'deliveryAddress.country': 'GB',
      'shopper.firstName': 'Moyo',
      'shopper.lastName': 'George',
      'shopper.gender': 'UNKNOWN',
      'shopper.telephoneNumber': '7427488747',
      'riskdata.deliveryMethod': 'ups-sacpo',
      referrerURL: 'https://www.sotostore.com/en/cart/view',
      dfValue: 'ryEGX8eZpJ0030000000000000BTWDfYZVR30055821336cVB94iKzBG7O9RfEsJTT5S16Goh5Mk004DoUm5LLinV00000YVxEr00000aIidmYG5x0QSIw5D9M5T:40',
      usingFrame: 'false',
      usingPopUp: 'false',
      shopperBehaviorLog:
        '{"numberBind":"1","holderNameBind":"1","cvcBind":"1","numberFieldFocusCount":"4","numberFieldLog":"fo@53,cl@54,bl@86,fo@295,cl@298,bl@310,fo@390,KU@390,ch@390,bl@390,fo@396,bl@434","numberFieldClickCount":"2","numberFieldBlurCount":"4","deactivate":"3","activate":"3","numberFieldKeyCount":"1","numberUnkKeysFieldLog":"undefined@390","numberFieldChangeCount":"1","numberFieldEvHa":"total=0","cvcFieldFocusCount":"1","cvcFieldLog":"fo@390,KU@390,ch@390,bl@390","cvcFieldKeyCount":"1","cvcUnkKeysFieldLog":"undefined@390","cvcFieldChangeCount":"1","cvcFieldEvHa":"total=0","cvcFieldBlurCount":"1","holderNameFieldFocusCount":"2","holderNameFieldLog":"fo@434,cl@436,bl@451,fo@464,Sd@470,KL@471,Su@471,KL@473,KL@473,KL@474,KL@490,KL@492,KL@495,KL@497,KL@500,KL@501,KL@504,KL@504,KL@506,Ks@507,Sd@508,KL@509,Su@509,KL@510,KL@511,KL@512,KL@513,KL@514,ch@520,bl@520","holderNameFieldClickCount":"1","holderNameFieldBlurCount":"2","holderNameFieldKeyCount":"22","holderNameFieldChangeCount":"1","holderNameFieldEvHa":"total=0"}'
    };
  };

  checkoutWithLink = async () => {
    log.info(`[Task - ${this.index + 1}] - Beggining Checkout`);
    try {
      const size = await this.getSizes('https://www.sotostore.com/en/product/15516/1992-nuptse-jacket');
      const addToCartResponse = await this.addToCart(size);
      await this.setShipping();
      const checkoutResponse = await this.checkout(addToCartResponse.body);
    } catch (error) {
      log.error(`[Task - ${this.index + 1}] - ${error}`);
    }
  };
}
