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
    this.active = false;
    this.ranOnce = false;
    this.checkoutCookies = [];
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

  returnCheckoutCookie = arg => {
    console.log(arg);
    console.log(this.checkoutCookies);
    ipcRenderer.send(OPEN_CAPTCHA_WINDOW, 'open');
    const webview = document.querySelector('webview');
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

    // webview.addEventListener('ipc-message', function(e) {
    //   if (e.channel === 'html-content') {
    //     console.log(e);
    //   }
    // });
    webview.executeJavaScript(`document.querySelector('html').style.visibility = "hidden";document.querySelector('.g-recaptcha').style.visibility = "visible"`);
    webview.addEventListener('did-finish-load', e => {
      if (!this.ranOnce) {
        const captchaToken = webview.executeJavaScript(`document.querySelector("iframe").src`, result => {
          console.log('ran once');
          ipcRenderer.send(SEND_SUPREME_CAPTCHA_URL, { captchaURL: result, id: arg.id });
          this.checkoutCookies.shift();
          this.active = false;
          this.ranOnce = true;
          if (this.checkoutCookies.length >= 1) {
            this.active = true;
            this.ranOnce = false;
            this.returnCheckoutCookie(this.checkoutCookies[0]);
          }
        });
      } else {
        this.ranOnce = false;
      }
    });
  };

  eventListenerCheckoutCookie = () => {
    ipcRenderer.on(RECEIVE_SUPREME_CHECKOUT_COOKIE, (event, arg) => {
      this.checkoutCookies.push(arg);
      if (!this.active) {
        this.active = true;
        this.returnCheckoutCookie(this.checkoutCookies[0]);
      }
    });
  };

  componentDidMount() {
    this.eventListenerCheckoutCookie();
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
