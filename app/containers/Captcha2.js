import React, { Component } from 'react';
import { Alert, Container, Row, Col, Button } from 'reactstrap';
import Particles from 'react-particles-js';
import CaptchaTopbar from '../components/CaptchaTopbar';
import CaptchaFooter from '../components/CaptchaFooter';
import { webview, remote, ipcRenderer } from 'electron';
import { BOT_SEND_COOKIES_AND_CAPTCHA_PAGE, CAPTCHA_RECEIVE_COOKIES_AND_CAPTCHA_PAGE } from '../utils/constants';
class Captchav2 extends Component {
  constructor(props) {
    super(props);
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
    for (const cookie of cookieArray) {
      const nameValuePair = cookie.replace(/\s+/g, '').split('=');
      formattedCookieArray.push({
        url: baseURL,
        value: nameValuePair[1],
        domain: baseURL.split('//')[1],
        path: '/',
        name: nameValuePair[0]
      });
    }
    return formattedCookieArray;
  };

  awaitCookiesAndCaptchaURL = () => {
    ipcRenderer.on(CAPTCHA_RECEIVE_COOKIES_AND_CAPTCHA_PAGE, (event, args) => {
      const webview = document.querySelector('webview');
      const win = remote.getCurrentWindow();
      const formattedCookies = this.convertCookieString(args.baseURL, args.cookies);
      for (const cookie of formattedCookies) {
        console.log(cookie);
        win.webContents.session.cookies.set(cookie, () => {});
      }
      webview.loadURL(args.checkoutURL);
      console.log(args);
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
