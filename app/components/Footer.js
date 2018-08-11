import React, { Component } from 'react';
import { Row, Col } from 'reactstrap';
import NotSignedIn from '../img/svg/notsignedin.svg';
import SignedIn from '../img/svg/signedin.svg';
import packageJson from '../../package.json';
import FontAwesome from 'react-fontawesome';
var shell = require('electron').shell;
export default class Footer extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <Row className="footer">
        <Col xs="3" className="text-center footerLeftSection">
          {this.props.type === 'homepage' ? <img className="footerStatus" src={SignedIn} /> : <img className="footerStatus" src={NotSignedIn} />}
        </Col>
        <Col xs="6" className="text-center footerCenterSection">
          Copyright © 2018 Photon - All Rights Reserved
        </Col>
        <Col xs="1" className="d-flex align-items-center">
          <a
            onClick={() => {
              shell.openExternal('https://twitter.com/bot_photon');
            }}
          >
            <FontAwesome name="twitter" className="twitterLogoFooter" />
          </a>
        </Col>
        <Col xs="2" className="text-right footerRightSection">
          version {packageJson.version}
        </Col>
      </Row>
    );
  }
}
