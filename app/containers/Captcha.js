import React, { Component } from "react";
import { Alert, Container, Row, Col, Button } from "reactstrap";
import Particles from "react-particles-js";
import CaptchaTopbar from "../components/CaptchaTopbar";
import CaptchaFooter from "../components/CaptchaFooter";
import { webview, remote, ipcRenderer } from "electron";
import { SEND_SUPREME_CHECKOUT_COOKIE, RECEIVE_SUPREME_CHECKOUT_COOKIE, OPEN_CAPTCHA_WINDOW, SEND_SUPREME_CAPTCHA_URL } from "../utils/constants";
class Captcha extends Component {
  constructor(props) {
    super(props);
  }

  goToGoogleLogin = () => {
    const webview = document.querySelector("webview");
    webview.loadURL("https://accounts.google.com/Login");
  };

  clearCookies = () => {
    const win = remote.getCurrentWindow();
    win.webContents.session.clearStorageData({
      storages: ["cookies"]
    });
  };

  convertCookieString = cookieString => {
    const cookieArray = cookieString.split(";");
    let formattedCookieArray = [];
    for (const cookie of cookieArray) {
      const nameValuePair = cookie.replace(/\s+/g, "").split("=");
      formattedCookieArray.push({
        url: "http://www.supremenewyork.com",
        value: nameValuePair[1],
        domain: ".supremenewyork.com",
        path: "/",
        name: nameValuePair[0]
      });
    }
    return formattedCookieArray;
  };

  eventListenerCheckoutCookie = () => {
    ipcRenderer.on(RECEIVE_SUPREME_CHECKOUT_COOKIE, (event, arg) => {
      ipcRenderer.send(OPEN_CAPTCHA_WINDOW, "open");
      const webview = document.querySelector("webview");
      const win = remote.getCurrentWindow();
      const formattedCookies = this.convertCookieString(arg.cookies);
      const windowProxy = arg.proxy !== undefined ? `http://${arg.proxy.user}:${arg.proxy.pass}@${arg.proxy.ip}:${arg.proxy.port}` : "";
      for (const cookie of formattedCookies) {
        win.webContents.session.cookies.set(cookie, () => {});
      }
      win.webContents.session.setProxy(
        {
          proxyRules: windowProxy
        },
        () => {
          webview.loadURL("http://supremenewyork.com/checkout");
        }
      );
      webview.addEventListener("ipc-message", function(e) {
        if (e.channel === "html-content") {
          console.log(e);
        }
      });
      webview.executeJavaScript(`document.querySelector('html').style.visibility = "hidden";document.querySelector('.g-recaptcha').style.visibility = "visible"`);
      webview.addEventListener("did-finish-load", e => {
        const captchaToken = webview.executeJavaScript(`document.querySelector("iframe").src`, result => {
          ipcRenderer.send(SEND_SUPREME_CAPTCHA_URL, result);
        });
      });
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
          src="https://accounts.google.com/Login"
          style={{
            display: "inline-flex",
            width: "100%",
            height: "calc(100% - 90px)"
          }}
        />
        <CaptchaFooter clearCookies={this.clearCookies} goToGoogleLogin={this.goToGoogleLogin} />
      </Container>
    );
  }
}

export default Captcha;
