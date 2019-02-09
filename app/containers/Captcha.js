import React, { Component } from 'react';
import { Container } from 'reactstrap';
import CaptchaTopbar from '../components/CaptchaTopbar';
import CaptchaFooter from '../components/CaptchaFooter';
import Waiting from '../components/Waiting';
import { remote, ipcRenderer, session } from 'electron';
import {
  SET_GLOBAL_ID_VARIABLE,
  CAPTCHA_RECEIVE_COOKIES_AND_CAPTCHA_PAGE,
  RECEIVE_CAPTCHA_TOKEN,
  FINISH_SENDING_CAPTCHA_TOKEN,
  MAIN_PROCESS_CLEAR_RECEIVE_CAPTCHA_TOKEN_LISTENERS
} from '../utils/constants';
var os = require('os');
const path = require('path');

class Captcha extends Component {
  constructor(props) {
    super(props);
    this.active = false;
    this.jobsQueue = [];
    this.state = {
      waiting: true
    };
  }

  goToGoogleLogin = () => {
    const webviewWindow = document.querySelector('webview');
    this.setState(
      {
        waiting: false
      },
      () => {
        webviewWindow.loadURL('https://accounts.google.com/Login');
      }
    );
  };

  goToYoutube = () => {
    const webviewWindow = document.querySelector('webview');
    this.setState(
      {
        waiting: false
      },
      () => {
        webviewWindow.loadURL('https://youtube.com');
      }
    );
  };

  clearCookies = () => {
    const win = remote.getCurrentWindow();
    win.webContents.session.clearStorageData({
      storages: ['cookies']
    });
  };

  convertCookieString = (baseURL, cookieString) => {
    if (cookieString.length > 0) {
      const cookieArray = cookieString.split(';');
      let formattedCookieArray = [];
      for (const cookie of cookieArray) {
        const nameValuePair = cookie.replace(/\s+/g, '').split('=');
        formattedCookieArray.push({
          url: baseURL.includes('supreme') ? `https://www.${baseURL.split('//')[1].split('/')[0]}` : baseURL,
          value: nameValuePair[1],
          domain: baseURL.includes('supreme') ? 'www.' + baseURL.split('//')[1].split('/')[0] : baseURL.split('//')[1].split('/')[0],
          path: '/',
          name: nameValuePair[0]
        });
      }
      return formattedCookieArray;
    } else {
      return [];
    }
  };

  processCaptcha = args => {
    this.active = true;
    const webview = document.querySelector('webview');
    const win = remote.getCurrentWindow();
    const formattedCookies = this.convertCookieString(args.checkoutURL, args.cookies);
    for (const cookie of formattedCookies) {
      win.webContents.session.cookies.set(cookie, error => {
        if (error !== null) {
          console.log(error);
        }
      });
    }

    if (process.env.NODE_ENV === 'development') {
      win.openDevTools();
      webview.openDevTools();
    }

    const sendGlobalVariable = ipcRenderer.sendSync(SET_GLOBAL_ID_VARIABLE, args);
    console.log(args);
    webview.loadURL(args.checkoutURL);
    ipcRenderer.once(FINISH_SENDING_CAPTCHA_TOKEN, (event, arg) => {
      if (this.jobsQueue.length > 0) {
        this.processCaptcha(this.jobsQueue.shift());
      } else {
        this.setState({ waiting: true });
        this.active = false;
        webview.loadURL('https://accounts.google.com/Login');
        ipcRenderer.removeAllListeners(RECEIVE_CAPTCHA_TOKEN);
        ipcRenderer.send(MAIN_PROCESS_CLEAR_RECEIVE_CAPTCHA_TOKEN_LISTENERS);
      }
    });
  };

  resetCaptchaWindow = () => {};

  awaitCookiesAndCaptchaURL = () => {
    ipcRenderer.on(CAPTCHA_RECEIVE_COOKIES_AND_CAPTCHA_PAGE, (event, args) => {
      if (!this.active) {
        this.active = true;
        this.setState({ waiting: false }, () => {
          this.processCaptcha(args);
        });
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
        <Waiting visible={this.state.waiting} />
        <webview
          id="captchaWebview"
          src="http://google.com"
          webpreferences="allowRunningInsecureContent, javascript=yes"
          preload="../../captchaPreload.js"
          // preload={path.normalize(path.resolve(__dirname, 'webpack-pack', 'captchaPreload.js'))}
          style={{
            width: '100%',
            height: this.state.waiting ? '0px' : 'calc(100% - 90px)'
          }}
        />
        <CaptchaFooter clearCookies={this.clearCookies} goToGoogleLogin={this.goToGoogleLogin} goToYoutube={this.goToYoutube} />
      </Container>
    );
  }
}

export default Captcha;
