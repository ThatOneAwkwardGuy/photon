// @flow
import React, { Component } from "react";
import { Container, Row, Col } from "reactstrap";
import ReactSVG from "react-svg";
import { auth } from "../api/firebase/";

export default class Footer extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <Row className="footer">
        <Col xs="2" className="text-center footerLeftSection">
          {this.props.type === "homepage" ? (
            <ReactSVG
              className="signedinicon text-right"
              path="img/signedin.svg"
            />
          ) : (
            <ReactSVG
              className="signedinicon text-right"
              path="img/notsignedin.svg"
            />
          )}
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
