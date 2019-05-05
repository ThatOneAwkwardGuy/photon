import stores from '../store/shops';
const rp = require('request-promise');
const cheerio = require('cheerio');
const _ = require('lodash');
const convert = require('xml-js');
const log = require('electron-log');

export const processKeywords = (keywordsString, colorString) => {
  if (keywordsString !== '' || colorString !== '') {
    const keywordsArray = keywordsString.split(' ');
    let positiveKeywords = [];
    const negativeKeywords = [];
    if (colorString !== '') {
      positiveKeywords = positiveKeywords.concat(colorString.toLowerCase().split(/[^a-zA-Z0-9']/));
    }
    keywordsArray.forEach(element => {
      if (element[0] === '+') {
        positiveKeywords.push(element.substr(1));
      } else if (element[0] === '-') {
        negativeKeywords.push(element.substr(1));
      }
    });
    return {
      positiveKeywords,
      negativeKeywords
    };
  }
};

export const getSitemapJSON = async siteurl => {
  try {
    const response = await rp({
      method: 'GET',
      uri: `${siteurl}/products.json?limit=25`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36'
      }
    });
    return ['JSON', JSON.parse(response)];
  } catch (e) {
    try {
      const XMLresponse = await getAtomSitemapXML(siteurl);
      return ['XML', XMLresponse];
    } catch (e) {
      console.error(e);
      log.error(e);
    }
    console.error(e);
    log.error(e);
  }
};

export const convertProductNameIntoArray = name => {
  return name.toLowerCase().split(/[^a-zA-Z0-9']/);
};

// Checks the ${site}/products.json link for a product matching the provided keywords
export const checkSitemapJSONForKeywords = (sitemapObj, keywords) => {
  for (const product of sitemapObj.products) {
    const productNameArray = product.title.toLowerCase().split(/[^a-zA-Z0-9']/);
    if (
      _.difference(keywords.positiveKeywords, productNameArray).length === 0 &&
      _.difference(keywords.negativeKeywords, productNameArray).length === keywords.negativeKeywords.length
    ) {
      // Returns product object with variants array already there
      return product;
    }
  }
};

// Checks ${site}/products_sitemap_1.xml for a product matching the provided keywords
export const checkSitemapXMLForKeywords = (sitemapObj, keywords) => {
  for (const product of sitemapObj.urlset.url) {
    const productName = _.get(product, "['image:image']['image:title']._text");
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
};

export const getSitemapXML = async siteurl => {
  try {
    const response = await rp({
      method: 'GET',
      url: `${siteurl}/sitemap_products_1.xml`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36'
      }
    });
    const productsXML2JSON = convert.xml2js(response, {
      compact: true,
      ignoreComment: true,
      ignoreDeclaration: true,
      ignoreInstruction: true,
      ignoreAttributes: true,
      ignoreCdata: true,
      ignoreDoctype: true,
      alwaysChildren: true
    });
    return productsXML2JSON;
  } catch (e) {
    console.error(e);
    log.error(e);
  }
};

export const getAtomSitemapXML = async siteurl => {
  try {
    const response = await rp({
      method: 'GET',
      url: `${siteurl}/collections/all/products.atom`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36'
      }
    });
    const productsXML2JSON = convert.xml2js(response, {
      compact: true,
      ignoreComment: true,
      ignoreDeclaration: true,
      ignoreInstruction: true,
      ignoreAttributes: false,
      ignoreCdata: true,
      ignoreDoctype: true,
      alwaysChildren: true
    });
    return productsXML2JSON;
  } catch (e) {
    console.error(e);
    log.error(e);
  }
};

export const checkAtomSitemapXMLForKeywords = (sitemapObj, keywords) => {
  for (const product of sitemapObj.feed.entry) {
    const productName = _.get(product, 'title._text');
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
};

export const undefeatedAccountLogin = async (accountObject, cookieJar) => {
  try {
    const response = await rp({
      method: 'POST',
      uri: `https://undefeated.com/account/login`,
      jar: cookieJar,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36',
        Cookie: cookieJar
      },
      form: {
        form_type: 'customer_login',
        utf8: '✓',
        'customer[email]': accountObject.email,
        'customer[password]': accountObject.password,
        checkout_url: ''
      },
      resolveWithFullResponse: true,
      followAllRedirects: true
    });
    return response;
  } catch (e) {
    console.error(e);
    log.error(e);
  }
};
