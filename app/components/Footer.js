import React, { Component } from "react";
import { Row, Col } from "reactstrap";
import NotSignedIn from "../img/notsignedin.svg";
import SignedIn from "../img/signedin.svg";

export default class Footer extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <Row className="footer">
        <Col xs="2" className="text-center footerLeftSection">
          {this.props.type === "homepage" ? <img className="logo" src={SignedIn} /> : <img className="logo" src={NotSignedIn} />}
        </Col>
        <Col xs="8" className="text-center footerCenterSection">
          Copyright © 2018 Photon - All Rights Reserved
        </Col>
        <Col xs="2" className="text-right footerRightSection">
          alpha-1.0.0
        </Col>
      </Row>
    );
  }
}
