import React, { Component } from 'react';
import { Alert, Container, Row, Col, Button } from 'reactstrap';
import Particles from 'react-particles-js';
import CaptchaTopbar from '../components/CaptchaTopbar';
import CaptchaFooter from '../components/CaptchaFooter';
import { webview, remote, ipcRenderer } from 'electron';
import { SEND_SUPREME_CHECKOUT_COOKIE, RECEIVE_SUPREME_CHECKOUT_COOKIE, OPEN_CAPTCHA_WINDOW, SEND_SUPREME_CAPTCHA_URL } from '../utils/constants';
class Captcha extends Component {
  constructor(props) {
    super(props);
    this.ranOnce = false;
    this.checkoutCookies = [];
    this.currentCaptchaID = '';
    this.active = false;
  }

  goToGoogleLogin = () => {
    const webviewWindow = document.querySelector('webview');
    webviewWindow.loadURL('https://accounts.google.com/Login');
  };

  clearCookies = () => {
    const win = remote.getCurrentWindow();
    win.webContents.session.clearStorageData({
      storages: ['cookies']
    });
  };

  convertCookieString = cookieString => {
    const cookieArray = cookieString.split(';');
    let formattedCookieArray = [];
    for (const cookie of cookieArray) {
      const nameValuePair = cookie.replace(/\s+/g, '').split('=');
      formattedCookieArray.push({
        url: 'http://www.supremenewyork.com',
        value: nameValuePair[1],
        domain: '.supremenewyork.com',
        path: '/',
        name: nameValuePair[0]
      });
    }
    return formattedCookieArray;
  };

  awaitCaptchaURL = webview => {
    ipcRenderer.on(RECEIVE_SUPREME_CHECKOUT_COOKIE, (event, arg) => {
      // console.log(arg);
      // if (this.checkoutCookies.length <= 0) {
      //   this.loadCheckoutWindow(arg, webview);
      // } else {
      //   this.checkoutCookies.push(arg);
      //   console.log(this.checkoutCookies);
      // }
      if (!this.active) {
        this.loadCheckoutWindow(arg, webview);
      } else {
        this.checkoutCookies.push(arg);
      }
    });
  };

  loadCheckoutWindow = (arg, webview) => {
    this.active = true;
    this.currentCaptchaID = arg.id;
    const win = remote.getCurrentWindow();
    const formattedCookies = this.convertCookieString(arg.cookies);
    const windowProxy = arg.proxy !== undefined ? `http://${arg.proxy.user}:${arg.proxy.pass}@${arg.proxy.ip}:${arg.proxy.port}` : '';
    for (const cookie of formattedCookies) {
      win.webContents.session.cookies.set(cookie, () => {});
    }
    if (windowProxy !== '') {
      win.webContents.session.setProxy(
        {
          proxyRules: windowProxy
        },
        () => {
          webview.loadURL('http://supremenewyork.com/checkout');
        }
      );
    } else {
      webview.loadURL('http://supremenewyork.com/checkout');
    }
    webview.executeJavaScript(`document.querySelector('html').style.visibility = "hidden";document.querySelector('.g-recaptcha').style.visibility = "visible"`);
    this.checkoutCookies.shift();
  };

  awaitCheckoutLoad = webview => {
    webview.addEventListener('did-finish-load', e => {
      webview.executeJavaScript(`window.location.pathname`, pathname => {
        console.log(pathname);
        if (pathname.includes('/checkout')) {
          webview.executeJavaScript(`document.querySelector("iframe").src`, result => {
            console.log('sending');
            ipcRenderer.send(SEND_SUPREME_CAPTCHA_URL, { captchaURL: result, id: this.currentCaptchaID });
            this.active = false;
            console.log(this.checkoutCookies.length);
            if (this.checkoutCookies.length > 0) {
              this.loadCheckoutWindow(this.checkoutCookies[0], webview);
            }
          });
        } else if (pathname.includes('/shop')) {
          ipcRenderer.send(SEND_SUPREME_CAPTCHA_URL, { captchaURL: 'Failed', id: this.currentCaptchaID });
        }
        if (this.checkoutCookies.length > 0) {
          console.log(this.checkoutCookies);
          this.loadCheckoutWindow(this.checkoutCookies[0], webview);
        }
      });
    });
  };

  componentDidMount() {
    const webview = document.querySelector('webview');
    this.awaitCaptchaURL(webview);
    this.awaitCheckoutLoad(webview);
  }

  render() {
    return (
      <Container fluid>
        <CaptchaTopbar />
        <webview
          id="captchaWebview"
          src="http://example.com/"
          style={{
            display: 'inline-flex',
            width: '100%',
            height: 'calc(100% - 90px)'
          }}
        />
        <CaptchaFooter clearCookies={this.clearCookies} goToGoogleLogin={this.goToGoogleLogin} />
      </Container>
    );
  }
}

export default Captcha;
