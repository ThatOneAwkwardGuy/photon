import React, { Component } from 'react';
import { Row, Col } from 'reactstrap';
import NotSignedIn from '../img/notsignedin.svg';
// import SignedIn from '../img/signedin.svg';
var SignedIn = require('svg-inline-loader?classPrefix!../img/signedin.svg');

export default class Footer extends Component {
  constructor(props) {
    super(props);
    console.log(SignedIn)
  }
  render() {
    return (
      <Row className="footer">
        <Col xs="2" className="text-center footerLeftSection">
          {this.props.type === 'homepage' ? <img className="footerStatus" src={SignedIn} /> : <img className="footerStatus" src={NotSignedIn} />}
        </Col>
        <Col xs="8" className="text-center footerCenterSection">
          Copyright © 2018 Photon - All Rights Reserved
        </Col>
        <Col xs="2" className="text-right footerRightSection">
          beta-1.0.0
        </Col>
      </Row>
    );
  }
}
