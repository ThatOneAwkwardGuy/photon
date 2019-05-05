import React, { Component } from 'react';
import { Alert, Container, Row, Col } from 'reactstrap';
import Sidebar from '../components/Sidebar';
import Active from './Active';
import Topbar from '../components/Topbar';
import Footer from '../components/Footer';
import { auth } from '../api/firebase/';
import { ipcRenderer } from 'electron';
import { BEGIN_UPDATE } from '../utils/constants';
const log = require('electron-log');

class HomePage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeWindow: 'Home',
      updateVersion: '',
      updateAvailable: false,
      updateBegun: false,
      fastModeModalVisible: false
    };
  }

  switchActiveComponent = windowName => {
    this.setState({
      activeWindow: windowName
    });
  };

  openFastModeModal = () => {
    this.setState({
      fastModeModalVisible: true
    });
  };

  toggleFastModeModal = () => {
    this.setState({
      fastModeModalVisible: !this.state.fastModeModalVisible
    });
  };

  checkAccount = () => {
    if (process.env.NODE_ENV !== 'development') {
      if (auth.authorise.currentUser === null) {
        this.props.history.push('/');
      }
    }
  };

  beginUpdate = () => {
    ipcRenderer.send(BEGIN_UPDATE, true);
    this.setState({ updateBegun: true, updateAvailable: false });
  };

  toggle() {
    this.setState({
      updateAvailable: false
    });
  }

  componentDidMount() {
    if (location.hash === '#waiting') {
      this.props.history.push('/waiting');
    } else if (location.hash === '#captcha') {
      this.props.history.push('/captcha');
    } else if (location.hash === '#captchaAutofill') {
      this.props.history.push('/captchaAutofill');
    } else if (location.hash === '#logs') {
      this.props.history.push('/logs');
    }
    this.checkAccount();
    log.info('Photon Started');
  }

  render() {
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
          <Sidebar
            activeWindow={this.state.activeWindow}
            switchActiveComponent={this.switchActiveComponent}
            checkAccount={this.checkAccount}
            history={this.props.history}
            openCaptchaWindow={this.openCaptchaWindow}
            toggleFastModeModal={this.toggleFastModeModal}
          />
          <Active
            activeWindow={this.state.activeWindow}
            switchActiveComponent={this.switchActiveComponent}
            getCaptchaWindow={this.getCaptchaWindowContents}
            fastModeModalVisible={this.state.fastModeModalVisible}
            toggleFastModeModal={this.toggleFastModeModal}
          />
        </Row>
        <Footer type="homepage" />
      </Container>
    );
  }
}

export default HomePage;
