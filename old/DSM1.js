export default class DSM {
  constructor(options, handleChangeStatus, propertiesHash) {
    this.options = options;
    this.handleChangeStatus = handleChangeStatus;
    this.propertiesHash = propertiesHash;
  }

  generatePaymentToken = async () => {
    this.handleChangeStatus("Generating Payment Token");
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
    } catch (e) {
      this.handleChangeStatus("Error Generating Payment Token");
      console.error(e);
    }
  };

  checkoutPoll = async (siteUrl, cookieJar) => {
    try {
      try {
        await rp({
          method: "GET",
          gzip: true,
          uri: `${siteUrl}/checkout.json`,
          resolveWithFullResponse: true,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.117 Safari/537.36"
          },
          jar: true
        });
      } catch (e) {
        console.error(e);
      }
      await rp({
        method: "GET",
        url: `${siteUrl}/throttle/queue?js_poll=1`,
        gzip: true,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36"
        },
        jar: true
      });
    } catch (e) {
      console.error(e);
    }
  };

  addToCart = async (variantID, cookieJar) => {
    let payload;
    payload = {
      id: variantID,
      quantity: this.options.task.quantity,
      "properties[_hash]": this.propertiesHash
    };
    try {
      this.handleChangeStatus("Adding To Cart");
      const response = await rp({
        method: "POST",
        form: payload,
        gzip: true,
        resolveWithFullResponse: true,
        uri: `${stores[this.options.task.store]}/cart/add.js`,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.117 Safari/537.36"
        },
        jar: true
      });
      return response;
    } catch (e) {
      this.handleChangeStatus("Failed - Adding To Cart");
      console.error(e);
    }
  };

  getCheckoutUrl = async cookieJar => {
    try {
      this.handleChangeStatus("Getting Checkout URL");
      const CheckoutURLResponse = await rp({
        method: "GET",
        gzip: true,
        uri: `${stores[this.options.task.store]}/checkout.json`,
        resolveWithFullResponse: true,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.117 Safari/537.36"
        },
        jar: true
      });
      return CheckoutURLResponse.request.href;
    } catch (e) {
      this.handleChangeStatus("Failed Getting Checkout URL");
      console.error(e);
    }
  };

  generateShippingToken = async cookieJar => {
    const payload = {
      shipping_address: {
        zip: this.options.profile.deliveryZip,
        country: this.options.profile.deliveryCountry,
        province: this.options.profile.deliveryProvince
      }
    };
    try {
      this.handleChangeStatus("Generating Shipping Token");
      const response = await rp({
        method: "POST",
        gzip: true,
        json: true,
        uri: `${stores[this.options.task.store]}/cart/shipping_rates.json`,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.117 Safari/537.36"
        },
        body: payload,
        jar: true
      });
      const shipOpt = response.shipping_rates[0].name.replace(/ /g, "%20");
      const shipPrc = response.shipping_rates[0].price;
      const shippingOption = `shopify-${shipOpt}-${shipPrc}`;
      return shippingOption;
    } catch (e) {
      this.handleChangeStatus("Failed Generating Shipping Token");
      console.error(e);
    }
  };

  sendCustomerInfo = async (generatedCheckoutURL, cookieJar) => {
    this.handleChangeStatus("Sending Customer Info");
    const payload = {
      utf8: "\u2713",
      _method: "patch",
      authenticity_token: "",
      previous_step: "contact_information",
      step: "shipping_method",
      "checkout[email]": this.options.profile.paymentEmail,
      "checkout[buyer_accepts_marketing]": "0",
      "checkout[shipping_address][first_name]": this.options.profile
        .deliveryFirstName,
      "checkout[shipping_address][last_name]": this.options.profile
        .deliveryLastName,
      "checkout[shipping_address][company]": "",
      "checkout[shipping_address][address1]": this.options.profile
        .deliveryAddress,
      "checkout[shipping_address][address2]": "",
      "checkout[shipping_address][city]": this.options.profile.deliveryCity,
      "checkout[shipping_address][country]": this.options.profile
        .deliveryCountry,
      "checkout[shipping_address][province]": this.options.profile
        .deliveryCountry,
      "checkout[shipping_address][zip]": this.options.profile.deliveryZip,
      "checkout[shipping_address][phone]": this.options.profile.phoneNumber,
      "checkout[remember_me]": "0",
      "checkout[client_details][browser_width]": "1710",
      "checkout[client_details][browser_height]": "1289",
      "checkout[client_details][javascript_enabled]": "1",
      button: ""
    };
    try {
      await rp({
        method: "POST",
        gzip: true,
        uri: generatedCheckoutURL,
        followAllRedirects: true,
        resolveWithFullResponse: true,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.117 Safari/537.36"
        },
        form: payload
      });
      return generatedCheckoutURL;
    } catch (e) {
      this.handleChangeStatus("Failed Sending Customer Info");
      console.error(e);
    }
  };

  getCheckoutBody = async (checkoutURL, cookieJar) => {
    const response = await rp({
      method: "GET",
      gzip: true,
      uri: `${checkoutURL}?step=payment_method`,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.117 Safari/537.36"
      },
      jar: true
    });
    return response;
  };

  returnFirstPaymentOptionID = paymentBody => {
    const $ = cheerio.load(paymentBody);

    return $("div.section.section--payment-method input").attr("value");
  };

  checkout = async (
    checkoutLink,
    paymentToken,
    shippingToken,
    paymentOptionID,
    cookieJar
  ) => {
    console.log(checkoutLink);
    console.log(paymentToken);
    console.log(shippingToken);
    console.log(paymentOptionID);
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
      "checkout[billing_address][first_name]": this.options.profile
        .billingFirstName,
      "checkout[billing_address][last_name]": this.options.profile
        .billingLastName,
      "checkout[billing_address][address1]": this.options.profile
        .billingAddress,
      "checkout[billing_address][address2]": "",
      "checkout[billing_address][city]": this.options.profile.billingCity,
      "checkout[billing_address][country]": this.options.profile.billingCountry,
      "checkout[billing_address][province]": this.options.profile
        .billingProvince,
      "checkout[billing_address][zip]": this.options.profile.billingZip,
      "checkout[billing_address][phone]": this.options.profile.phoneNumber,
      "checkout[shipping_rate][id]": shippingToken,
      complete: "1",
      "checkout[client_details][browser_width]": (
        Math.floor(Math.random() * 2000) + 1000
      ).toString(),
      "checkout[client_details][browser_height]": (
        Math.floor(Math.random() * 2000) + 1000
      ).toString(),
      "checkout[client_details][javascript_enabled]": "1",
      "checkout[total_price]": "4300",
      button: ""
    };
    try {
      this.handleChangeStatus("Checking Out");
      const response = await rp({
        method: "POST",
        gzip: true,
        uri: `${checkoutLink}?step=payment_method`,
        form: payload,
        resolveWithFullResponse: true,
        followAllRedirects: true,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.117 Safari/537.36"
        },
        jar: true
      });
      return response;
    } catch (e) {
      console.error(e);
    }
  };

  checkoutWithVariant = async variantID => {
    let cookieJar = rp.jar();
    const startTime = Date.now();
    console.log(
      `[${moment().format(
        "HH:mm:ss:SSS"
      )}] - Adding To Cart and Submitting Payment`
    );
    const [addToCart, paymentToken] = await Promise.all([
      this.addToCart(variantID, cookieJar),
      this.generatePaymentToken()
    ]);
    console.log(`[${moment().format("HH:mm:ss:SSS")}] - Getting Checkout URL`);
    const checkoutUrl = await this.getCheckoutUrl(cookieJar);
    if (
      this.options.task.store === "DSM-EU" ||
      this.options.task.store === "DSM-US"
    ) {
      const checkoutPoll = this.checkoutPoll(
        stores[this.options.task.store],
        cookieJar
      );
    }
    console.log(
      `[${moment().format(
        "HH:mm:ss:SSS"
      )}] - Submitting Customer Info, Getting Shipping Token and Payment ID`
    );
    const [sendCustomerInfo, shippingToken, checkoutBody] = await Promise.all([
      this.sendCustomerInfo(checkoutUrl, cookieJar),
      this.generateShippingToken(cookieJar),
      this.getCheckoutBody(checkoutUrl, cookieJar)
    ]);
    const paymentOptionID = this.returnFirstPaymentOptionID(checkoutBody);
    console.log(`[${moment().format("HH:mm:ss:SSS")}] - Checking Out`);
    const shippingTokenSent = await this.sendShippingToken(
      shippingToken,
      checkoutUrl,
      cookieJar
    );
    const checkout = await this.checkout(
      checkoutUrl,
      paymentToken,
      shippingToken,
      paymentOptionID,
      cookieJar
    );
    console.log(`[${moment().format("HH:mm:ss:SSS")}] - Checkout Complete`);
    console.log(checkout);
    return checkout;
  };
}
