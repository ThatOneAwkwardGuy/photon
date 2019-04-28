import stores from '../store/shops';
import Shopify from './stores/Shopify';
import DSM from './stores/DSM';
import Supreme from './stores/Supreme';
import SSENSE from './stores/SSENSE';
import Asphaltgold from './stores/Asphaltgold';
import Overkill from './stores/Overkill';
import SOTOStore from './stores/SOTOStore';
import { processKeywords, getSitemapJSON, checkSitemapJSONForKeywords, convertProductNameIntoArray, checkAtomSitemapXMLForKeywords } from './helpers.js';
import passwordSites from '../store/passwordSites';
const log = require('electron-log');
const rp = require('request-promise');
const cheerio = require('cheerio');
const moment = require('moment');
const _ = require('lodash');
const sizeSynonymns = {
  XSmall: ['XSMALL', 'XS', 'XSmall', 'X-Small'],
  Small: ['SMALL', 'S', 'Small'],
  Medium: ['Medium', 'M', 'MEDIUM', 'Med', 'MED'],
  Large: ['LARGE', 'L', 'Large'],
  XLarge: ['XLARGE', 'X-Large', 'X-LARGE', 'XL'],
  XXLarge: ['XXLARGE', 'XX-Large', 'XXL', 'XX-LARGE'],
  'N/A': ['N/A', 'Default Title', 'One Size', 'O/S', 'F']
};
export default class Task {
  constructor(options, forceUpdateFunction, settings, checkoutProxy, monitorProxies, index) {
    for (const site in settings.customSites) {
      stores[site] = settings.customSites[site];
    }
    this.index = index;
    this.forceUpdate = forceUpdateFunction;
    this.options = options;
    this.status = 'Not Started';
    this.active = false;
    this.keywords = processKeywords(this.options.task.keywords, options.task.keywordColor);
    this.settings = settings;
    this.proxy = checkoutProxy;
    this.monitorProxy = monitorProxies[Math.floor(Math.random() * monitorProxies.length)];
    this.monitoringTimeout = '';
    this.monitoring = false;
    this.supremeInstance = '';
    this.alreadySetTimeout = false;
    this.scheduledTimeout = '';
    this.productName = '';
    this.runOnce = false;
    this.cookieJar = rp.jar();
    this.rp = rp.defaults({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36'
      },
      proxy: this.options.task.proxy === '' ? (this.proxy !== undefined ? this.returnFormattedProxy() : '') : `http://${this.options.task.proxy}`,
      jar: this.cookieJar
    });
  }

  handleChangeStatus = status => {
    this.status = status;
    this.forceUpdate();
  };

  handleChangeProductName = newProductName => {
    this.productName = newProductName;
    this.forceUpdate();
  };

  returnFormattedProxy = () => {
    if (this.proxy.user === 'none' && this.proxy.pass === 'none') {
      return `http://${this.proxy.ip}:${this.proxy.port}`;
    } else {
      return `http://${this.proxy.user}:${this.proxy.pass}@${this.proxy.ip}:${this.proxy.port}`;
    }
  };

  sleep = ms => {
    console.log(`[${moment().format('HH:mm:ss:SSS')}] - Sleeping For ${ms}ms`);
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  stopTask = (checkoutComplete = false) => {
    switch (this.options.task.store) {
      case 'supreme-eu':
        if (this.supremeInstance !== '') {
          this.supremeInstance.stop();
          this.supremeInstance.stopMonitoring();
          this.active = false;
          if ((checkoutComplete !== undefined) & !checkoutComplete) {
            this.handleChangeStatus('Stopped');
          }
        }
      case 'supreme-us':
        if (this.supremeInstance !== '') {
          this.supremeInstance.stop();
          this.supremeInstance.stopMonitoring();
          this.active = false;
          if ((checkoutComplete !== undefined) & !checkoutComplete) {
            this.handleChangeStatus('Stopped');
          }
        }
      case 'supreme-autofill':
        if (this.supremeInstance !== '') {
          this.supremeInstance.stop();
          this.supremeInstance.stopMonitoring();
          this.supremeInstance.stopWindow();
          this.active = false;
          if ((checkoutComplete !== undefined) & !checkoutComplete) {
            this.handleChangeStatus('Stopped');
          }
        }
      default:
        clearTimeout(this.monitoringTimeout);
        clearTimeout(this.scheduledTimeout);
        this.active = false;
        if ((checkoutComplete !== undefined) & !checkoutComplete) {
          this.handleChangeStatus('Stopped');
        }
    }
  };

  run = async () => {
    console.log(`[${moment().format('HH:mm:ss:SSS')}] - Started`);
    this.active = true;
    if (this.options.task.scheduledTime !== '' && this.options.task.scheduledTime !== undefined && this.alreadySetTimeout === false) {
      if (Date(this.options.task.scheduledTime) <= Date.now()) {
        this.handleChangeStatus('Time has already passed');
        return;
      }
      this.handleChangeStatus('Waiting');
      this.alreadySetTimeout = true;
      this.scheduledTimeout = setTimeout(this.run, new Date(this.options.task.scheduledTime).getTime() * 1000 - Date.now());
    } else {
      if (!this.monitoring) {
        this.handleChangeStatus('Started');
      }
      switch (this.options.task.store) {
        case 'supreme-eu':
          this.Supreme();
          break;
        case 'supreme-us':
          this.Supreme();
          break;
        case 'supreme-autofill':
          this.Supreme();
          break;
        case 'dsm-eu':
          this.DSM();
          break;
        case 'dsm-us':
          this.DSM();
          break;
        case 'ssense':
          this.SSENSE();
          break;
        case 'asphaltgold':
          this.Asphaltgold();
          break;
        case 'overkill':
          this.Overkill();
          break;
        case 'sotostore':
          this.SOTOStore();
          break;
        default:
          if (!this.runOnce) {
            if (passwordSites.includes(this.options.task.store)) {
              this.handleChangeStatus('Signing In');
              await this.handleSignIn();
            }
            this.handleChangeStatus('Generating Checkout');
            this.shopifyCheckoutURL = await this.getQueueBypassCheckoutLink();
            this.runOnce = true;
          }
          switch (this.options.task.mode) {
            case 'url':
              this.urlMode();
              break;
            case 'keywords':
              this.keywordsMode();
              break;
            case 'variant':
              this.variantMode();
              break;
            case 'homepage':
              this.homepageMode();
              break;
            default:
              this.handleChangeStatus('Stopped');
              this.active = false;
              break;
          }
      }
    }
  };

  handleSignIn = async () => {
    const payload = {
      form_type: 'customer_login',
      utf8: '✓',
      'customer[email]': this.options.task.email,
      'customer[password]': this.options.task.password
    };
    try {
      const response = await this.rp({
        method: 'POST',
        form: payload,
        uri: `${stores[this.options.task.store]}/account/login`,
        resolveWithFullResponse: true,
        followRedirect: true,
        followAllRedirects: true
      });
    } catch (e) {
      this.handleChangeStatus(`Failed Signing In`);
    }
  };

  changeMonitorProxy = () => {
    this.monitorProxy = monitorProxies[Math.floor(Math.random() * monitorProxies.length)];
  };

  getQueueBypassCheckoutLink = async () => {
    try {
      const response = await this.rp({
        method: 'GET',
        uri: `${stores[this.options.task.store]}/checkout.js`,
        resolveWithFullResponse: true,
        followRedirect: true,
        followAllRedirects: true
      });
      console.log(response);
      return response.request.headers.referer;
    } catch (e) {
      console.log(e);
      return e.response.headers.location;
    }
  };

  Supreme = () => {
    this.supremeInstance = new Supreme(
      this.options,
      this.keywords,
      this.handleChangeStatus,
      this.settings,
      this.proxy,
      this.monitorProxy,
      this.stopTask,
      this.handleChangeProductName,
      this.run,
      this.index
    );
    try {
      this.supremeInstance.checkout();
    } catch (e) {
      log.error(`[Task - ${this.index + 1}] - ${e}`);
      if (this.active) {
        this.monitoring = true;
        this.handleChangeStatus('Monitoring');
        this.monitoringTimeout = setTimeout(this.Supreme, this.settings.monitorTime);
      } else {
        clearTimeout(this.monitoringTimeout);
      }
    }
  };

  DSM = async () => {
    try {
      this.handleChangeStatus('Generating Checkout');
      if (this.options.task.store !== 'dsm-us') {
        this.shopifyCheckoutURL = await this.getQueueBypassCheckoutLink();
      }
      const pageURL = this.options.task.modeInput === '' ? stores[this.options.task.store] : this.options.task.modeInput;
      const content = await this.getVariantsFromHomepage(pageURL);
      const variantID = this.getVariantIDOfSize(content.variantIDs, this.options.task.size, this.options.task.keywordColor);
      if (variantID !== undefined) {
        const DSMInstance = new DSM(
          this.options,
          this.handleChangeStatus,
          content.propertiesHash,
          this.proxy,
          this.stopTask,
          this.shopifyCheckoutURL,
          this.cookieJar,
          this.settings,
          this.run,
          this.handleChangeProductName,
          this.index
        );
        const checkoutResponse = await DSMInstance.checkoutWithVariant(variantID);
        return checkoutResponse;
      } else {
        if (this.settings.monitorForRestock) {
          this.handleChangeStatus(`Size Is Unavailable - Retrying in ${this.settings.monitorTime}ms`);
          await this.sleep(this.settings.monitorTime);
          this.run();
        } else {
          this.handleChangeStatus(`Size Is Unavailable`);
        }
      }
    } catch (e) {
      log.error(`[Task - ${this.index + 1}] - ${e}`);
    }
  };

  SSENSE = async () => {
    try {
      const SSENSEInstance = new SSENSE(
        this.options,
        this.keywords,
        this.handleChangeStatus,
        this.handleChangeProductName,
        this.proxy,
        this.stopTask,
        this.cookieJar,
        this.settings,
        this.run,
        this.index
      );
      const checkoutResponse = await SSENSEInstance.checkout();
    } catch (error) {
      if (this.settings.retryOnCheckoutError) {
        this.handleChangeStatus(`Error (${error.message}) - Retrying in ${this.settings.errorTime}ms`);
        await this.sleep(this.settings.errorTime);
        this.run();
      } else {
        this.handleChangeStatus(`Error (${error.message})`);
      }
      log.error(`[Task - ${this.index + 1}] - ${error}`);
    }
  };

  SOTOStore = async () => {
    try {
      const SOTOInstance = new SOTOStore(
        this.options,
        this.keywords,
        this.handleChangeStatus,
        this.handleChangeProductName,
        this.proxy,
        this.stopTask,
        this.cookieJar,
        this.settings,
        this.run,
        this.index
      );
      if (this.options.task.mode === 'url') {
        const checkoutResponse = await SOTOInstance.checkoutWithLink();
      }
    } catch (error) {
      if (this.settings.retryOnCheckoutError) {
        this.handleChangeStatus(`Error (${error.message}) - Retrying in ${this.settings.errorTime}ms`);
        await this.sleep(this.settings.errorTime);
        this.run();
      } else {
        this.handleChangeStatus(`Error (${error.message})`);
      }
      log.error(`[Task - ${this.index + 1}] - ${error}`);
    }
  };

  Asphaltgold = async () => {
    try {
      const AsphaltgoldInstance = new Asphaltgold(
        this.options,
        this.keywords,
        this.handleChangeStatus,
        this.handleChangeProductName,
        this.proxy,
        this.stopTask,
        this.cookieJar,
        this.settings,
        this.run,
        this.index
      );
      if (this.options.task.mode === 'url') {
        const checkoutResponse = await AsphaltgoldInstance.checkoutWithLink();
      } else if (this.options.task.mode === 'keywords') {
        const checkoutResponse = await AsphaltgoldInstance.checkoutWithKeywords();
      }
    } catch (error) {
      if (this.settings.retryOnCheckoutError) {
        this.handleChangeStatus(`Error (${error.message}) - Retrying in ${this.settings.errorTime}ms`);
        await this.sleep(this.settings.errorTime);
        this.run();
      } else {
        this.handleChangeStatus(`Error (${error.message})`);
      }
      log.error(`[Task - ${this.index + 1}] - ${error}`);
    }
  };

  Overkill = async () => {
    try {
      this.handleChangeStatus('Generating Checkout');
      const OverkillInstance = new Overkill(
        this.options,
        this.keywords,
        this.handleChangeStatus,
        this.handleChangeProductName,
        this.proxy,
        this.stopTask,
        this.cookieJar,
        this.settings,
        this.run,
        this.index
      );
      if (this.options.task.mode === 'url') {
        const checkoutResponse = await OverkillInstance.checkoutWithURL(this.options.task.modeInput);
      } else if (this.options.task.mode === 'keywords') {
        const checkoutResponse = await OverkillInstance.checkoutWithKeywords();
      }
    } catch (error) {
      if (this.settings.retryOnCheckoutError) {
        this.handleChangeStatus(`Error (${error.message}) - Retrying in ${this.settings.errorTime}ms`);
        await this.sleep(this.settings.errorTime);
        this.run();
      } else {
        this.handleChangeStatus(`Error (${error.message})`);
      }
      log.error(`[Task - ${this.index + 1}] - ${error}`);
    }
  };

  checkoutWithGroupOfVariants = async variantIDs => {
    try {
      console.log(`[${moment().format('HH:mm:ss:SSS')}] - Getting Variant Of Specified Size`);
      const variantID = this.getVariantIDOfSize(variantIDs, this.options.task.size, this.options.task.keywordColor);
      if (variantID !== undefined) {
        const shopifyCheckoutClass = new Shopify(
          this.options,
          this.handleChangeStatus,
          this.proxy,
          this.stopTask,
          this.shopifyCheckoutURL,
          this.cookieJar,
          this.settings,
          this.run,
          this.index
        );
        const checkoutResponse = await shopifyCheckoutClass.checkoutWithVariant(variantID);
        return checkoutResponse;
      } else {
        if (this.settings.monitorForRestock) {
          this.handleChangeStatus(`Size Is Unavailable - Retrying in ${this.settings.monitorTime}ms`);
          await this.sleep(this.settings.monitorTime);
          this.run();
        } else {
          this.handleChangeStatus('Size Is Unavailable');
        }
      }
    } catch (e) {
      log.error(`[Task - ${this.index + 1}] - ${e}`);
    }
  };

  urlMode = async () => {
    try {
      const variantIDs = await this.getVariantsFromLinkJSON(this.options.task.modeInput);
      const checkoutWithGroupOfVariants = await this.checkoutWithGroupOfVariants(variantIDs);
    } catch (e) {
      log.error(`[Task - ${this.index + 1}] - ${e}`);
      if (this.settings.retryOnCheckoutError) {
        this.handleChangeStatus(`Size Is Unavailable - Retrying in ${this.settings.monitorTime}ms`);
        await this.sleep(this.settings.monitorTime);
        this.run();
      } else {
        this.handleChangeStatus('Size Is Unavailable');
      }
    }
  };

  keywordsMode = async () => {
    try {
      console.log(`[${moment().format('HH:mm:ss:SSS')}] - Searching For Product`);
      const variantIDs = await this.getVariantsFromKeywords(stores[this.options.task.store]);
      const checkoutWithGroupOfVariants = await this.checkoutWithGroupOfVariants(variantIDs);
    } catch (e) {
      log.error(`[Task - ${this.index + 1}] - ${e}`);
      if (this.settings.retryOnCheckoutError) {
        this.handleChangeStatus(`Size Is Unavailable - Retrying in ${this.settings.monitorTime}ms`);
        await this.sleep(this.settings.monitorTime);
        this.run();
      } else {
        this.handleChangeStatus('Size Is Unavailable');
      }
    }
  };

  variantMode = async variant => {
    const shopifyCheckoutClass = new Shopify(
      this.options,
      this.handleChangeStatus,
      this.proxy,
      this.stopTask,
      this.shopifyCheckoutURL,
      this.cookieJar,
      this.settings,
      this.run,
      this.index
    );
    try {
      const checkoutResponse = await shopifyCheckoutClass.checkoutWithVariant(this.options.task.modeInput);
    } catch (error) {
      log.error(`[Task - ${this.index + 1}] - ${e}`);
      if (this.settings.retryOnCheckoutError) {
        this.handleChangeStatus(`Size Is Unavailable - Retrying in ${this.settings.monitorTime}ms`);
        await this.sleep(this.settings.monitorTime);
        this.run();
      } else {
        this.handleChangeStatus('Size Is Unavailable');
      }
    }
  };

  homepageMode = async () => {
    try {
      const pageURL = this.options.task.modeInput === '' ? stores[this.options.task.store] : this.options.task.modeInput;
      const content = await this.getVariantsFromHomepage(pageURL);
      const checkoutWithGroupOfVariants = await this.checkoutWithGroupOfVariants(content.variantIDs, content.propertiesHash);
    } catch (error) {
      log.error(`[Task - ${this.index + 1}] - ${e}`);
      if (this.settings.retryOnCheckoutError) {
        this.handleChangeStatus(`Size Is Unavailable - Retrying in ${this.settings.monitorTime}ms`);
        await this.sleep(this.settings.monitorTime);
        this.run();
      } else {
        this.handleChangeStatus('Size Is Unavailable');
      }
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

  getVariantIDOfSize = (variantsArray, size, color) => {
    try {
      const found = [];
      if (this.options.task.store.includes('dsm')) {
        for (const variant in variantsArray) {
          if (
            (_.get(variantsArray[variant], 'option1') && this.checkSize(_.get(variantsArray[variant], 'option1'), size)) ||
            (_.get(variantsArray[variant], 'option2') && this.checkSize(_.get(variantsArray[variant], 'option2'), size)) ||
            (_.get(variantsArray[variant], 'option3') && this.checkSize(_.get(variantsArray[variant], 'option3'), size)) ||
            (_.get(variantsArray[variant], 'public_title') && this.checkSize(_.get(variantsArray[variant], 'public_title'), size)) ||
            (_.get(variantsArray[variant], 'option1') && this.checkSize(_.get(variantsArray[variant], 'option1').toLowerCase(), color.toLowerCase())) ||
            (_.get(variantsArray[variant], 'option2') && this.checkSize(_.get(variantsArray[variant], 'option2').toLowerCase(), color.toLowerCase())) ||
            (_.get(variantsArray[variant], 'option3') && this.checkSize(_.get(variantsArray[variant], 'option3').toLowerCase(), color.toLowerCase())) ||
            (_.get(variantsArray[variant], 'public_title') && this.checkSize(_.get(variantsArray[variant], 'public_title').toLowerCase(), color.toLowerCase()))
          ) {
            found.push(variantsArray[variant].id);
          }
        }
      } else {
        variantsArray.forEach(variant => {
          if (
            (_.get(variant, 'option1') && this.checkSize(_.get(variant, 'option1'), size)) ||
            (_.get(variant, 'option2') && this.checkSize(_.get(variant, 'option2'), size)) ||
            (_.get(variant, 'option3') && this.checkSize(_.get(variant, 'option3'), size)) ||
            (_.get(variant, 'public_title') && this.checkSize(_.get(variant, 'public_title'), size)) ||
            (_.get(variant, 'option1') && this.checkSize(_.get(variant, 'option1').toLowerCase(), color.toLowerCase())) ||
            (_.get(variant, 'option2') && this.checkSize(_.get(variant, 'option2').toLowerCase(), color.toLowerCase())) ||
            (_.get(variant, 'option3') && this.checkSize(_.get(variant, 'option3').toLowerCase(), color.toLowerCase())) ||
            (_.get(variant, 'public_title') && this.checkSize(_.get(variant, 'public_title').toLowerCase(), color.toLowerCase()))
          ) {
            found.push(variant.id);
          }
        });
      }
      return found[0];
    } catch (error) {
      console.log(error);
      log.error(`[Task - ${this.index + 1}] - ${e}`);
    }
  };

  getVariantsFromLinkJSON = async link => {
    try {
      const response = await rp({
        method: 'GET',
        uri: `${link}.json`,
        json: true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36'
        }
      });
      return response.product.variants;
    } catch (e) {
      console.log(e);
      log.error(`[Task - ${this.index + 1}] - ${e}`);
      const variantsSecondTry = await this.getVariantsFromLinkHTML(link);
      return variantsSecondTry;
    }
  };

  getVariantsFromLinkHTML = async link => {
    try {
      const response = await rp({
        method: 'GET',
        uri: link,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36'
        }
      });
      const page = cheerio.load(response);
      let element;
      let propertiesHash;
      const variantsObj = page('script').map((i, element) => {
        const scriptText = _.get(element, 'children[0].data');
        if (scriptText !== undefined && scriptText.includes('var meta =')) {
          const JSONRegex = /\{.*\:\{.*\:.*\}\}/.exec(scriptText)[0];
          const VariantIds = JSON.parse(JSONRegex).product.variants;
          return VariantIds;
        }
      });
      if (!link.includes('eflash-us') && link.includes('doverstreetmarket')) {
        try {
          const response = await rp({
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36'
            },
            uri: 'https://cdn.shopify.com/s/files/1/1940/4611/t/1/assets/custom.js'
          });
          propertiesHash = response.slice(
            response.indexOf(`<input type="hidden" value="`) + `<input type="hidden" value="`.length,
            response.indexOf(`" name="properties[_hash]"`)
          );
        } catch (e) {
          console.error(e);
        }
      } else if (link.includes('eflash-us') && link.includes('doverstreetmarket')) {
        propertiesHash = response.match(/.val\((.*?)\)/)[1];
      }
      return { variantIDs: variantsObj, propertiesHash: propertiesHash };
    } catch (e) {
      log.error(`[Task - ${this.index + 1}] - ${e}`);
      if (this.active) {
        if (e.statusCode == '403') {
          this.changeMonitorProxy();
        }
        this.monitoring = true;
        this.handleChangeStatus('Monitoring');
        this.monitoringTimeout = setTimeout(this.run, this.settings.monitorTime);
      } else {
        clearTimeout(this.monitoringTimeout);
      }
    }
  };

  getVariantsFromKeywords = async siteUrl => {
    try {
      const siteMap = await getSitemapJSON(siteUrl);
      if (siteMap[0] === 'JSON') {
        const matchedProductJSON = checkSitemapJSONForKeywords(siteMap[1], this.keywords);
        this.handleChangeProductName(matchedProductJSON.title);
        return matchedProductJSON.variants;
      } else if (siteMap[0] === 'XML') {
        const matchedProductXML = checkAtomSitemapXMLForKeywords(siteMap[1], this.keywords);
        this.handleChangeProductName(matchedProductXML.title._text);
        const productVariant = await this.getVariantsFromLinkJSON(matchedProductXML.link._attributes.href);
        return productVariant;
      }
    } catch (e) {
      log.error(`[Task - ${this.index + 1}] - ${e}`);
      if (this.active) {
        this.monitoring = true;
        this.handleChangeStatus('Monitoring');
        this.monitoringTimeout = setTimeout(this.run, this.settings.monitorTime);
      } else {
        clearTimeout(this.monitoringTimeout);
      }
      console.error(e);
    }
  };

  getVariantsFromHomepage = async siteUrl => {
    try {
      const response = await rp({
        method: 'GET',
        url: siteUrl,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36'
        }
      });
      const page = cheerio.load(response);
      const pageURLs = page('a').map((i, element) => {
        let textArray = convertProductNameIntoArray(page(element).text()).filter(elem => elem !== '');
        if (
          textArray.length > 0 &&
          _.difference(this.keywords.positiveKeywords, textArray).length === 0 &&
          _.difference(this.keywords.negativeKeywords, textArray).length === this.keywords.negativeKeywords.length
        ) {
          return `${siteUrl}${element.attribs.href}`;
        }
      });
      const variantIDs = this.getVariantsFromLinkJSON(pageURLs[0]);
      return variantIDs;
    } catch (e) {
      log.error(`[Task - ${this.index + 1}] - ${e}`);
      if (this.active) {
        this.monitoring = true;
        this.handleChangeStatus('Monitoring');
        this.monitoringTimeout = setTimeout(this.run, this.settings.monitorTime);
      } else {
        clearTimeout(this.monitoringTimeout);
      }
      console.error(e);
    }
  };
}
