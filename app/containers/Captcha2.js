import React, { Component } from 'react';
import { Container } from 'reactstrap';
import CaptchaTopbar from '../components/CaptchaTopbar';
import CaptchaFooter from '../components/CaptchaFooter';
import Waiting from '../components/Waiting';
import { remote, ipcRenderer, session } from 'electron';
import { SET_GLOBAL_ID_VARIABLE, CAPTCHA_RECEIVE_COOKIES_AND_CAPTCHA_PAGE, RECEIVE_CAPTCHA_TOKEN, FINISH_SENDING_CAPTCHA_TOKEN } from '../utils/constants';
var os = require('os');

class Captchav2 extends Component {
  constructor(props) {
    super(props);
    this.active = false;
    this.jobsQueue = [];
    this.state = {
      waiting: true
    };
    // ipcRenderer.on('login', (event, webContents, request, authInfo, callback) => {
    //   callback('admin', 'photon123');
    // });
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
    const cookieArray = cookieString.split(';');
    let formattedCookieArray = [];
    const operatingSystem = os.platform();
    for (const cookie of cookieArray) {
      console.log(cookie);
      const nameValuePair = cookie.replace(/\s+/g, '').split('=');
      formattedCookieArray.push({
        url: baseURL.includes('supreme') ? `https://www.${baseURL.split('//')[1]}` : baseURL,
        // url: operatingSystem === 'darwin' ? baseURL.split('//')[1] : baseURL,
        value: nameValuePair[1],
        domain: baseURL.split('//')[1].split('/')[0],
        path: '/',
        name: nameValuePair[0]
      });
    }
    return formattedCookieArray;
  };

  processCaptcha = args => {
    console.log(this.jobsQueue);
    this.active = true;
    const webview = document.querySelector('webview');
    const win = remote.getCurrentWindow();
    const formattedCookies = this.convertCookieString(args.checkoutURL, args.cookies);
    for (const cookie of formattedCookies) {
      console.log(cookie);
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

    // webview.addEventListener('did-finish-load', e => {
    //   // win.webContents.session.cookies.get({}, (error, cookies) => {
    //   //   console.log(error, cookies);
    //   // });
    //   if (!e.target.src.includes('google.com')) {
    //     webview.executeJavaScript(`
    //     document.querySelector('body').style.height = "200px";
    //     document.querySelector('html').style.visibility = "hidden";
    //     document.querySelector('.g-recaptcha').style.visibility = "visible";
    //     document.querySelector('.g-recaptcha').style.position = "fixed";
    //     document.querySelector('.g-recaptcha').style.top = "10px";
    //     document.querySelector('.g-recaptcha').style.marginTop = "0px";`);
    //   }
    // });

    const sendGlobalID = ipcRenderer.sendSync(SET_GLOBAL_ID_VARIABLE, args.id);
    webview.loadURL(args.checkoutURL);
    ipcRenderer.once(FINISH_SENDING_CAPTCHA_TOKEN, () => {
      // ipcRenderer.removeAllListeners(FINISH_SENDING_CAPTCHA_TOKEN);
      if (this.jobsQueue.length > 0) {
        this.processCaptcha(this.jobsQueue.shift());
      } else {
        this.setState({ waiting: true });
        this.active = false;
        webview.loadURL('https://accounts.google.com/Login');
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
          preload="../app/utils/captchaPreload.js"
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

export default Captchav2;
