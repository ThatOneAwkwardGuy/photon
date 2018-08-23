import React, { Component } from 'react';
import { Container } from 'reactstrap';
import CaptchaTopbar from '../components/CaptchaTopbar';
import CaptchaFooter from '../components/CaptchaFooter';
import { remote, ipcRenderer } from 'electron';
import { SET_GLOBAL_ID_VARIABLE, CAPTCHA_RECEIVE_COOKIES_AND_CAPTCHA_PAGE, RECEIVE_CAPTCHA_TOKEN } from '../utils/constants';
var os = require('os');

class Captchav2 extends Component {
  constructor(props) {
    super(props);
    this.active = false;
    this.jobsQueue = [];
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

  convertCookieString = (baseURL, cookieString) => {
    const cookieArray = cookieString.split(';');
    let formattedCookieArray = [];
    const operatingSystem = os.platform();
    for (const cookie of cookieArray) {
      const nameValuePair = cookie.replace(/\s+/g, '').split('=');
      formattedCookieArray.push({
        url: operatingSystem === 'darwin' ? baseURL.split('//')[1] : baseURL,
        value: nameValuePair[1],
        domain: baseURL.split('//')[1],
        path: '/',
        name: nameValuePair[0]
      });
    }
    return formattedCookieArray;
  };

  processCaptcha = args => {
    const webview = document.querySelector('webview');
    const win = remote.getCurrentWindow();
    const formattedCookies = this.convertCookieString(args.baseURL, args.cookies);
    for (const cookie of formattedCookies) {
      win.webContents.session.cookies.set(cookie, () => {});
    }
    win.openDevTools();
    webview.openDevTools();
    ipcRenderer.send(SET_GLOBAL_ID_VARIABLE, args.id);
    // webview.addEventListener('did-finish-load', e => {
    //   if (!e.target.src.includes('google.com')) {
    //     // webview.openDevTools();
    //     // webview.executeJavaScript(`
    //     // document.querySelector('body').style.height = "200px";
    //     // document.querySelector('html').style.visibility = "hidden";
    //     // document.querySelector('.g-recaptcha').style.visibility = "visible";
    //     // document.querySelector('.g-recaptcha').style.position = "fixed";
    //     // document.querySelector('.g-recaptcha').style.top = "10px";
    //     // document.querySelector('.g-recaptcha').style.marginTop = "0px";`);
    //   }
    // });

    webview.loadURL(args.checkoutURL);
    //There doesnt seem to be a reason for both RECEIVE_CAPTCHA_TOKEN and CAPTCHA_RECEIVE_COOKIES_AND_CAPTCHA_PAGE to be seperate;
    ipcRenderer.on(RECEIVE_CAPTCHA_TOKEN, () => {
      if (this.jobsQueue.length > 0) {
        console.log(this.jobsQueue);
        this.processCaptcha(this.jobsQueue.shift());
      } else {
        ipcRenderer.removeAllListeners(RECEIVE_CAPTCHA_TOKEN);
        webview.loadURL('https://accounts.google.com/Login');
      }
    });
  };

  awaitCookiesAndCaptchaURL = () => {
    ipcRenderer.on(CAPTCHA_RECEIVE_COOKIES_AND_CAPTCHA_PAGE, (event, args) => {
      if (!this.active) {
        this.active = true;
        this.processCaptcha(args);
      } else {
        this.jobsQueue.push(args);
      }
    });
  };

  componentDidMount() {
    this.awaitCookiesAndCaptchaURL();
  }

  render() {
    return (
      <Container fluid>
        <CaptchaTopbar />
        <webview
          id="captchaWebview"
          src="https://accounts.google.com/Login"
          webpreferences="allowRunningInsecureContent, javascript=yes"
          preload="../app/utils/captchaPreload.js"
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

export default Captchav2;
