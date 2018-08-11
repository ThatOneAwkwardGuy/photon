import React, { Component } from 'react';
import { Row, Col } from 'reactstrap';
import Logo from '../img/svg/logo.svg';
import Minimize from '../img/svg/minimise.svg';
import Close from '../img/svg/close.svg';
import { remote } from 'electron';
export default class Topbar extends Component {
  minimiseWindow = () => {
    console.log('minimising');
    remote.getCurrentWindow().minimize();
  };

  closeWindow = () => {
    // remote.BrowserWindow.getFocusedWindow().close();
    remote.getCurrentWindow().close();
  };

  render() {
    return (
      <Row className="topbar">
        <Col xs="2" className="topBarLogoCol text-center">
          <img className="logo" src={Logo} />
        </Col>
        <Col xs="8" className="topbarMiddle" />
        <Col xs="1" className="text-right topbarOptionsCol">
          <div
            className="windowButton"
            onClick={() => {
              this.minimiseWindow();
            }}
          >
            <img src={Minimize} />
          </div>
        </Col>
        <Col xs="1" className="text-left topbarOptionsCol">
          <div
            className="windowButton"
            onClick={() => {
              this.closeWindow();
            }}
          >
            <img src={Close} />
          </div>
        </Col>
      </Row>
    );
  }
}
