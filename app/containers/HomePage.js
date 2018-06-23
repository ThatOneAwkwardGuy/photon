import React, { Component } from 'react';
import { Alert, Container, Row, Col } from 'reactstrap';
import Sidebar from '../components/Sidebar';
import Active from './Active';
import Topbar from '../components/Topbar';
import Footer from '../components/Footer';
import { auth } from '../api/firebase/';
import { webview, remote, ipcRenderer } from 'electron';
import { ALERT_RENDERER_OF_QUIT, ALERT_UPDATE_AVAILABLE, CHECK_FOR_UPDATE, BEGIN_UPDATE } from '../utils/constants';
import { setUserToCurrentlyActive, setUserToCurrentlyInactive } from '../api/firebase/firestore';

const electron = require('electron');
class HomePage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeWindow: 'Home',
      updateVersion: '',
      updateAvailable: false,
      updateBegun: false
    };
    this.switchActiveComponent = this.switchActiveComponent.bind(this);
    this.checkAccount = this.checkAccount.bind(this);
    this.win = new electron.remote.BrowserWindow({
      show: false,
      modal: true,
      minWidth: 400,
      minHeight: 600,
      width: 400,
      height: 600,
      resizable: false,
      frame: false,
      webPreferences: {
        devTools: true
      }
    });
    auth.authorise.onAuthStateChanged(user => {
      if (user) {
        setUserToCurrentlyActive(user.uid);
      }
    });
    ipcRenderer.on(ALERT_RENDERER_OF_QUIT, (event, arg) => {
      auth.authorise.onAuthStateChanged(user => {
        if (user) {
          setUserToCurrentlyInactive(user.uid);
        }
      });
    });
    window.onbeforeunload = e => {
      auth.authorise.onAuthStateChanged(user => {
        if (user) {
          setUserToCurrentlyInactive(user.uid);
        }
      });
    };
    // ipcRenderer.on(ALERT_UPDATE_AVAILABLE, (event, arg) => {
    //   console.log(arg);
    //   this.setState({
    //     updateVersion: arg.version,
    //     updateAvailable: true
    //   });
    // });

    // ipcRenderer.send(CHECK_FOR_UPDATE, true);
  }

  async switchActiveComponent(windowName) {
    this.setState({
      activeWindow: windowName
    });
  }

  checkAccount() {
    if (auth.authorise.currentUser === null) {
      this.props.history.push('/');
    }
  }

  beginUpdate = () => {
    ipcRenderer.send(BEGIN_UPDATE, true);
    this.setState({ updateBegun: true, updateAvailable: false });
  };

  toggle() {
    this.setState({
      updateAvailable: false
    });
  }

  render() {
    this.checkAccount();
    return (
      <Container fluid>
        <Topbar />
        <Row className="homeContainer">
          <Alert className="updateAlert" color="danger" isOpen={this.state.updateAvailable} toggle={this.toggle}>
            A new update (version {this.state.updateVersion}) is avalable. For information on the changes please check the discord.
            <a className="bold" onClick={this.beginUpdate}>
              click here to update.
            </a>
          </Alert>
          <Alert className="updateAlert" color="danger" isOpen={this.state.updateBegun}>
            Please wait while we install the update.
          </Alert>
          <Sidebar activeWindow={this.state.activeWindow} switchActiveComponent={this.switchActiveComponent} checkAccount={this.checkAccount} history={this.props.history} openCaptchaWindow={this.openCaptchaWindow} win={this.win} />
          <Active activeWindow={this.state.activeWindow} getCaptchaWindow={this.getCaptchaWindowContents} win={this.win} />
        </Row>
        <Footer type="homepage" />
      </Container>
    );
  }
}

export default HomePage;
