import stores from "../store/shops";
const _ = require("lodash");
const rp = require("request-promise");
const convert = require("xml-js");
const cheerio = require("cheerio");

export default class Shopify {
  constructor(options) {
    this.task = options.task;
    this.profile = options.profile;
    this.forceUpdate = options.forceUpdate;
  }

  // handleChangeStatus(status) {
  //   this.status = status;
  //   this.forceUpdate();
  // }

  // getProducts = async () => {
  //   const options = { ignoreComment: true, alwaysChildren: true };
  //   try {
  //     const productsJSON = await rp.get(
  //       `${stores[stores[this.task.store]]}/products.json`
  //     );
  //     return productsJSON.json();
  //   } catch (e) {
  //     console.error(e);
  //     try {
  //       const productsXML = await rp.get(
  //         `${stores[this.task.store]}/sitemap_products_1.xml`
  //       );
  //       const productsXML2JSON = convert.xml2js(productsXML, options);
  //       return productsXML2JSON;
  //     } catch (e) {
  //       console.error(e);
  //     }
  //   }
  // };

  // processKeywords = () => {
  //   const keywordsArray = this.keywords.split(',');
  //   const positiveKeywords = [];
  //   const negativeKeywords = [];
  //   keywordsArray.array.forEach(element => {
  //     if (element[0] === '+') {
  //       positiveKeywords.push(element.substr(1));
  //     } else if (element[0] === '-') {
  //       negativeKeywords.push(element.substr(1));
  //     }
  //   });
  //   return {
  //     positiveKeywords,
  //     negativeKeywords
  //   };
  // };

  // returnMatchingProductInProducts = async (mode, data, keywords) => {
  //   if (mode === 'xml') {
  //     data.urlset.url.forEach(async element => {
  //       const nameArray = element['image:image']['image:title']
  //         .toLowerCase()
  //         .split(/[\s,]+/);
  //       if (
  //         nameArray != undefined &&
  //         _.difference(nameArray, keywords.positiveKeywords).length === 0 &&
  //         _.difference(nameArray, keywords.positiveKeywords).length ===
  //           nameArray.length
  //       ) {
  //         const productJSON = await rp.get(`${element.loc}.json`);
  //         const variants = productJSON.variants;
  //         return variants;
  //       }
  //     });
  //   } else if (mode === 'json') {
  //     data.products.forEach(element => {
  //       const nameArray = element.title.split(/[\s,]+/);
  //       if (
  //         _.difference(nameArray, keywords.positiveKeywords).length === 0 &&
  //         _.difference(nameArray, keywords.positiveKeywords).length ===
  //           nameArray.length
  //       ) {
  //         const variants = element.variants;
  //         return variants;
  //       }
  //     });
  //   }
  // };

  // getVariantsFromProductURL = async () => {
  //   try {
  //     const response = await rp({
  //       method: 'GET',
  //       json: true,
  //       uri: `${this.task.modeInput}.json`,
  //       gzip: true,
  //       headers: {
  //         'User-Agent':
  //           'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.117 Safari/537.36'
  //       }
  //     });
  //     return response.product.variants;
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  // getVariantOfSize = (size, variants) => {
  //   const found = [];
  //   variants.forEach(variant => {
  //     if (variant.option1.includes(size)) {
  //       found.push(variant.id);
  //     }
  //   });
  //   return found[0];
  // };

  // generateCheckoutURL = variantID => {
  //   const checkoutURL = `${stores[this.task.store]}/cart/${variantID}:${
  //     this.task.quantity
  //   }`;
  //   return checkoutURL;
  // };

  generatePaymentToken = async () => {
    this.forceUpdate();
    const payload = {
      credit_card: {
        number: this.profile.paymentCardnumber,
        name: this.profile.paymentCardholdersName,
        month: this.profile.paymentCardExpiryMonth,
        year: this.profile.paymentCardExpiryYear,
        verification_value: this.profile.paymentCVV
      }
    };
    try {
      const response = await rp({
        method: "POST",
        json: true,
        uri: "https://elb.deposit.shopifycs.com/sessions",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.117 Safari/537.36"
        },
        body: payload
      });
      return response.id;
    } catch (error) {
      console.error(error);
    }
  };

  addToCart = async (variantID, cookieJar) => {
    const checkoutURL = `${stores[this.task.store]}/cart/add.js?quantity=${
      this.task.quantity
    }&id=${variantID}`;
    try {
      const response = await rp({
        method: "GET",
        gzip: true,
        resolveWithFullResponse: true,
        uri: checkoutURL,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.117 Safari/537.36",
          Cookie: cookieJar.getCookieString(stores[this.task.store])
        },
        jar: cookieJar
      });
      return response;
    } catch (error) {
      this.handlechangestatus("Failed - Adding To Cart");
      console.error(error);
    }
  };

  generateShippingToken = async cookieJar => {
    const payload = {
      shipping_address: {
        zip: this.profile.deliveryZip,
        country: this.profile.deliveryCountry,
        province: this.profile.deliveryProvince
      }
    };
    try {
      const response = await rp({
        method: "POST",
        gzip: true,
        json: true,
        uri: `${stores[this.task.store]}/cart/shipping_rates.json`,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.117 Safari/537.36",
          Cookie: cookieJar.getCookieString(stores[this.task.store])
        },
        body: payload,
        jar: cookieJar
      });
      const shipOpt = response.shipping_rates[0].name.replace(/ /g, "%20");
      const shipPrc = response.shipping_rates[0].price;
      const shippingOption = `shopify-${shipOpt}-${shipPrc}`;
      return shippingOption;
    } catch (error) {
      console.error(error);
    }
  };

  async sendCustomerInfo(cookieJar) {
    this.handleChangeStatus("Sending Customer Info");
    let generatedCheckoutURL;

    const payload = {
      utf8: "\u2713",
      _method: "patch",
      authenticity_token: "",
      previous_step: "contact_information",
      step: "shipping_method",
      "checkout[email]": this.profile.paymentEmail,
      "checkout[buyer_accepts_marketing]": "0",
      "checkout[shipping_address][first_name]": this.profile.deliveryFirstName,
      "checkout[shipping_address][last_name]": this.profile.deliveryLastName,
      "checkout[shipping_address][company]": "",
      "checkout[shipping_address][address1]": this.profile.deliveryAddress,
      "checkout[shipping_address][address2]": "",
      "checkout[shipping_address][city]": this.profile.deliveryCity,
      "checkout[shipping_address][country]": this.profile.deliveryCountry,
      "checkout[shipping_address][province]": this.profile.deliveryCountry,
      "checkout[shipping_address][zip]": this.profile.deliveryZip,
      "checkout[shipping_address][phone]": "7427488747",
      "checkout[remember_me]": "0",
      "checkout[client_details][browser_width]": "1710",
      "checkout[client_details][browser_height]": "1289",
      "checkout[client_details][javascript_enabled]": "1",
      button: ""
    };
    try {
      try {
        const CheckoutURLResponse = await rp({
          method: "GET",
          gzip: true,
          uri: `${stores[this.task.store]}/checkout.json`,
          resolveWithFullResponse: true,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.117 Safari/537.36",
            Cookie: cookieJar.getCookieString(stores[this.task.store])
          },
          jar: cookieJar
        });
        generatedCheckoutURL = CheckoutURLResponse.request.href;
      } catch (e) {
        console.error(e);
      }
      await rp({
        method: "POST",
        gzip: true,
        uri: generatedCheckoutURL,
        followAllRedirects: true,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.117 Safari/537.36",
          Cookie: cookieJar.getCookieString(stores[this.task.store])
        },
        form: payload,
        jar: cookieJar
      });
      return generatedCheckoutURL;
    } catch (e) {
      console.error(e);
    }
  }

  getCheckoutBody = async (checkoutURL, cookieJar) => {
    const response = await rp({
      method: "GET",
      gzip: true,
      uri: `${checkoutURL}?step=payment_method`,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.117 Safari/537.36",
        Cookie: cookieJar.getCookieString(stores[this.task.store])
      },
      jar: cookieJar
    });
    return response;
  };

  returnFirstPaymentOptionID = paymentBody => {
    const $ = cheerio.load(paymentBody);
    return $("div.radio__input input").attr("value");
  };

  checkoutWithVariant = async variantID => {
    const cookieJar = rp.jar();
    const addToCartResponse = await this.addToCart(variantID, cookieJar);
    console.log(addToCartResponse);
    const sendCustomerInfo = await this.sendCustomerInfo(cookieJar);
    console.log(sendCustomerInfo);
    const shippingToken = await this.generateShippingToken(cookieJar);
    console.log(shippingToken);
    const checkoutBody = await this.getCheckoutBody(
      sendCustomerInfo,
      cookieJar
    );
    console.log(checkoutBody);
    const paymentOptionID = this.returnFirstPaymentOptionID(checkoutBody);
    const paymentToken = await this.generatePaymentToken();
    const checkout = await this.checkout(
      sendCustomerInfo,
      paymentToken,
      shippingToken,
      paymentOptionID,
      cookieJar
    );
    return checkout;
  };

  checkout = async (
    checkoutLink,
    paymentToken,
    shippingToken,
    paymentOptionID,
    cookieJar
  ) => {
    const payload = {
      utf8: "\u2713",
      _method: "patch",
      authenticity_token: "",
      previous_step: "payment_method",
      step: "",
      s: paymentToken,
      "checkout[payment_gateway]": paymentOptionID,
      "checkout[credit_card][vault]": "false",
      "checkout[different_billing_address]": "true",
      "checkout[billing_address][first_name]": this.profile.billingFirstName,
      "checkout[billing_address][last_name]": this.profile.billingLastName,
      "checkout[billing_address][address1]": this.profile.billingAddress,
      "checkout[billing_address][address2]": "",
      "checkout[billing_address][city]": this.profile.billingCity,
      "checkout[billing_address][country]": this.profile.billingCountry,
      "checkout[billing_address][province]": this.profile.billingProvince,
      "checkout[billing_address][zip]": this.profile.billingZip,
      "checkout[billing_address][phone]": "07427488747",
      "checkout[shipping_rate][id]": shippingToken,
      complete: "1",
      "checkout[client_details][browser_width]": (
        Math.floor(Math.random() * 2000) + 1000
      ).toString(),
      "checkout[client_details][browser_height]": (
        Math.floor(Math.random() * 2000) + 1000
      ).toString(),
      "checkout[client_details][javascript_enabled]": "1",
      "g-recaptcha-repsonse": "",
      button: ""
    };
    const response = await rp({
      method: "POST",
      gzip: true,
      uri: `${checkoutLink}`,
      form: payload,
      resolveWithFullResponse: true,
      followAllRedirects: true,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.117 Safari/537.36",
        Cookie: cookieJar.getCookieString(checkoutLink)
      },
      jar: cookieJar
    });
    return response;
  };

  async completeCheckout() {
    const variantIDs = await this.getVariantsFromProductURL();
    const variantID = this.getVariantOfSize(this.task.size, variantIDs);
    const checkout = await this.checkoutWithVariant(variantID);
    console.log(checkout);
  }
}
