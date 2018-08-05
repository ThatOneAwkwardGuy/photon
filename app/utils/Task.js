import stores from '../store/shops';
import Shopify from './Shopify';
import DSM from './DSM';
import Supreme from './Supreme';
import { processKeywords, getSitemapJSON, getSitemapXML, checkSitemapJSONForKeywords, checkSitemapXMLForKeywords, convertProductNameIntoArray } from './helpers.js';
const rp = require('request-promise');
const cheerio = require('cheerio');
const _ = require('lodash');
const convert = require('xml-js');
const sizeSynonymns = {
  XSmall: ['XSMALL', 'XS', 'XSmall', 'X-Small'],
  Small: ['SMALL', 'S', 'Small'],
  Medium: ['Medium', 'M', 'MEDIUM', 'Med', 'MED'],
  Large: ['LARGE', 'L', 'Large'],
  XLarge: ['XLARGE', 'X-Large', 'X-LARGE', 'XL'],
  XXLarge: ['XXLARGE', 'XX-Large', 'XXL', 'XX-LARGE']
};
export default class Task {
  constructor(options, forceUpdateFunction, settings, checkoutProxy, monitorProxies) {
    this.forceUpdate = forceUpdateFunction;
    this.options = options;
    this.status = 'Not Started';
    this.active = false;
    this.keywords = processKeywords(this.options.task.keywords);
    this.settings = settings;
    this.proxy = checkoutProxy;
    this.monitorProxy = monitorProxies[Math.floor(Math.random() * monitorProxies.length)];
    this.monitoringTimeout = '';
    this.active = false;
    this.monitoring = false;
    this.supremeInstance = '';
    this.alreadySetTimeout = false;
    this.scheduledTimeout = '';
  }

  handleChangeStatus = status => {
    this.status = status;
    this.forceUpdate();
  };

  stop = () => {
    switch (this.options.task.store) {
      case 'Supreme':
        this.supremeInstance.stop();
      default:
        clearTimeout(this.monitoringTimeout);
        clearTimeout(this.scheduledTimeout);
        this.active = false;
        this.handleChangeStatus('Stopped');
    }
  };

  run = () => {
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
      this.active = true;
      switch (this.options.task.store) {
        case 'Supreme':
          this.Supreme();
          break;
        case 'DSM-EU':
          this.DSM();
          break;
        case 'DSM-US':
          this.DSM();
          break;
        default:
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

  changeMonitorProxy = () => {
    this.monitorProxy = monitorProxies[Math.floor(Math.random() * monitorProxies.length)];
  };

  Supreme = () => {
    this.supremeInstance = new Supreme(this.options, this.keywords, this.handleChangeStatus, this.settings, this.proxy, this.monitorProxy);
    try {
      this.supremeInstance.checkout();
    } catch (e) {
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
    const pageURL = this.options.task.modeInput === '' ? stores[this.options.task.store] : this.options.task.modeInput;
    const content = await this.getVariantsFromHomepage(pageURL);
    const variantID = this.getVariantIDOfSize(content.variantIDs, this.options.task.size);
    if (variantID !== undefined) {
      const DSMInstance = new DSM(this.options, this.handleChangeStatus, content.propertiesHash, this.proxy);
      const checkoutResponse = await DSMInstance.checkoutWithVariant(variantID);
      return checkoutResponse;
    } else {
      this.handleChangeStatus('Size Is Unavailable');
    }
  };

  checkoutWithGroupOfVariants = async variantIDs => {
    const variantID = this.getVariantIDOfSize(variantIDs, this.options.task.size);
    if (variantID !== undefined) {
      const shopifyCheckoutClass = new Shopify(this.options, this.handleChangeStatus, this.proxy);
      const checkoutResponse = await shopifyCheckoutClass.checkoutWithVariant(variantID);
      return checkoutResponse;
    } else {
      this.handleChangeStatus('Size Is Unavailable');
    }
  };

  urlMode = async () => {
    const variantIDs = await this.getVariantsFromLinkJSON(this.options.task.modeInput);
    const checkoutWithGroupOfVariants = await this.checkoutWithGroupOfVariants(variantIDs);
  };

  keywordsMode = async () => {
    const variantIDs = await this.getVariantsFromKeywords(stores[this.options.task.store]);
    const checkoutWithGroupOfVariants = await this.checkoutWithGroupOfVariants(variantIDs);
  };

  variantMode = async variant => {
    const shopifyCheckoutClass = new Shopify(this.options, this.handleChangeStatus);
    const checkoutResponse = await shopifyCheckoutClass.checkoutWithVariant(this.options.task.modeInput);
  };

  homepageMode = async () => {
    const pageURL = this.options.task.modeInput === '' ? stores[this.options.task.store] : this.options.task.modeInput;
    const content = await this.getVariantsFromHomepage(pageURL);
    console.log(content.propertiesHash);
    const checkoutWithGroupOfVariants = await this.checkoutWithGroupOfVariants(content.variantIDs, content.propertiesHash);
  };

  checkSize = (option, size) => {
    const sizeNames = sizeSynonymns[size];
    if (sizeNames !== undefined) {
      for (const size of sizeNames) {
        if (size === option) {
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

  getVariantIDOfSize = (variants, size) => {
    const variantsArray = variants;
    const found = [];
    if (this.options.task.store.includes('DSM')) {
      for (const variant in variantsArray) {
        if (
          (_.get(variantsArray[variant], 'option1') && this.checkSize(_.get(variantsArray[variant], 'option1'), size)) ||
          (_.get(variantsArray[variant], 'option2') && this.checkSize(_.get(variantsArray[variant], 'option2'), size)) ||
          (_.get(variantsArray[variant], 'public_title') && this.checkSize(_.get(variantsArray[variant], 'public_title'), size))
        ) {
          found.push(variantsArray[variant].id);
        }
      }
    } else {
      variantsArray.forEach(variant => {
        if ((_.get(variant, 'option1') && this.checkSize(_.get(variant, 'option1'), size)) || (_.get(variant, 'option2') && this.checkSize(_.get(variant, 'option2'), size)) || (_.get(variant, 'public_title') && this.checkSize(_.get(variant, 'public_title'), size))) {
          found.push(variant.id);
        }
      });
    }
    return found[0];
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
      if (link.includes('doverstreetmarket')) {
        try {
          const response = await rp({
            method: 'GET',
            uri: 'https://cdn.shopify.com/s/files/1/1940/4611/t/1/assets/custom.js'
          });
          propertiesHash = response.slice(response.indexOf(`<input type="hidden" value="`) + `<input type="hidden" value="`.length, response.indexOf(`" name="properties[_hash]"`));
        } catch (e) {
          console.error(e);
        }
      }
      return { variantIDs: variantsObj, propertiesHash: propertiesHash };
    } catch (e) {
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
        return matchedProductJSON.variants;
      } else if (siteMap[0] === 'XML') {
        const matchedProductXML = checkSitemapXMLForKeywords(siteMap[1], this.keywords);
        const productVariant = await this.getVariantsFromLinkJSON(matchedProductXML.loc._text);
        return productVariant;
      }
    } catch (e) {
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
        const textArray = convertProductNameIntoArray(page(element).text());
        if (textArray.length > 0 && _.difference(this.keywords.positiveKeywords, textArray).length === 0 && _.difference(this.keywords.negativeKeywords, textArray).length === this.keywords.negativeKeywords.length) {
          return `${siteUrl}${element.attribs.href}`;
        }
      });
      const variantIDs = this.getVariantsFromLinkJSON(pageURLs[0]);
      return variantIDs;
    } catch (e) {
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
