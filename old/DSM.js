import stores from '../store/shops';
const rp = require('request-promise');
const cheerio = require('cheerio');

export async function DSMEflashCheckoutPoll(cookieJar) {
  try {
    try {
      await rp({
        method: 'GET',
        gzip: true,
        uri: `${stores[this.task.store]}/checkout.json`,
        resolveWithFullResponse: true,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.117 Safari/537.36',
          Cookie: cookieJar.getCookieString(stores[this.task.store])
        },
        jar: cookieJar
      });
    } catch (e) {
      console.error(e);
    }
    await rp({
      method: 'GET',
      url: `${stores[this.task.store]}/throttle/queue?js_poll=1`,
      gzip: true,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36',
        Cookie: cookieJar.getCookieString(stores[this.task.store])
      },
      jar: cookieJar
    });
  } catch (e) {
    console.error(e);
  }
}

export async function DSMCheckoutWithVariant(variantID) {
  const cookieJar = rp.jar();
  await this.addToCart(variantID, cookieJar);
  await this.DSMEflashCheckoutPoll();
  const sendCustomerInfo = await this.sendCustomerInfo(cookieJar);
  const shippingToken = await this.generateShippingToken(cookieJar);
  const checkoutBody = await this.getCheckoutBody(sendCustomerInfo, cookieJar);
  const paymentOptionID = this.returnFirstPaymentOptionID(checkoutBody);
  const paymentToken = await this.generatePaymentToken();
  const checkout = await this.checkout(
    sendCustomerInfo,
    paymentToken,
    shippingToken,
    paymentOptionID,
    cookieJar
  );
  this.handleChangeStatus('Checkout Complete?');
  return checkout;
}

export async function DSMEflashPageCheck() {
  this.handleChangeStatus('Getting Eflash Page');
  try {
    const response = await rp({
      method: 'GET',
      url: `${stores[this.task.store]}`,
      gzip: true,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36'
      }
    });
    return response;
  } catch (e) {
    this.handleChangeStatus('Failed - Getting Eflash Page');
    console.error(e);
  }
}

export async function DSMEflashGetVariantIds(productURL) {
  try {
    const response = await rp({
      method: 'GET',
      url: `${stores[this.task.store]}/${productURL}`,
      gzip: true,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36'
      }
    });
    const $ = cheerio.load(response);
    const variantsObj = JSON.parse($('#ProductJson-product-template').html())
      .variants;
    console.log(variantsObj);
    const variantIDs = [];
    variantsObj.forEach(element => {
      variantIDs.push(element.id);
    });
    return variantIDs;
  } catch (e) {
    console.error(e);
  }
}


export async function DSMEflashCheck() {
  this.handleChangeStatus('Checking EFLASH Check');
  const page = await this.DSMEflashPageCheck();
  const $ = cheerio.load(page);
  if (
    !page.includes('dsmny-flash-hold.png') &&
    !page.includes('dsml-flash-hold.png')
  ) {
    const allLinks = [];
    let variantIDs = [];
    $('.grid-view-item__link').each((index, element) => {
      allLinks.push(element.attribs.href);
    });
    allLinks.forEach(async url => {
      variantIDs = await this.DSMEflashGetVariantIds(url);
      variantIDs.forEach(variantID => {
        this.DSMCheckoutWithVariant(variantID);
      });
    });
  } else {
    this.handleChangeStatus('Waiting For EFLASH Page');
    setTimeout(this.DSMEflashCheck, 500);
  }
}
