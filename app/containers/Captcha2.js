import React, { Component } from 'react';
import { Alert, Container, Row, Col, Button } from 'reactstrap';
import Particles from 'react-particles-js';
import CaptchaTopbar from '../components/CaptchaTopbar';
import CaptchaFooter from '../components/CaptchaFooter';
import { webview, remote, ipcRenderer } from 'electron';
import { BOT_SEND_COOKIES_AND_CAPTCHA_PAGE, CAPTCHA_RECEIVE_COOKIES_AND_CAPTCHA_PAGE, SEND_CAPTCHA_RESPONSE, RECEIVE_CAPTCHA_TOKEN } from '../utils/constants';
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

    webview.addEventListener('did-finish-load', e => {
      if (!e.target.src.includes('google.com')) {
        // webview.openDevTools();
        // webview.executeJavaScript(`
        // document.querySelector('body').style.height = "200px";
        // document.querySelector('html').style.visibility = "hidden";
        // document.querySelector('.g-recaptcha').style.visibility = "visible";
        // document.querySelector('.g-recaptcha').style.position = "fixed";
        // document.querySelector('.g-recaptcha').style.top = "10px";
        // document.querySelector('.g-recaptcha').style.marginTop = "0px";`);
      }
    });
    webview.loadURL(args.checkoutURL);
    global.tokenID = args.id;

    webview.executeJavaScript(
      `
    alert(${args.id});
    console.log(${args.id});`,
      response => {
        console.log(response);
      }
    );

    webview.executeJavaScript(`var tokenID = ${args.id};`, response => {
      console.log(response);
    });

    ipcRenderer.on(RECEIVE_CAPTCHA_TOKEN, args => {
      if (this.jobsQueue.length > 0) {
        this.processCaptcha(this.jobsQueue.shift());
      } else {
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
