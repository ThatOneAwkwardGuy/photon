// @flow
import React, { Component } from "react";
import { Container, Row, Col } from "reactstrap";
import ReactSVG from "react-svg";
import { remote } from "electron";

type Props = {};

export default class Topbar extends Component<Props> {
  props: Props;

  minimiseWindow() {
    remote.BrowserWindow.getFocusedWindow().minimize();
  }

  closeWindow() {
    remote.BrowserWindow.getFocusedWindow().close();
  }

  constructor() {
    super();
    this.minimiseWindow = this.minimiseWindow.bind(this);
    this.closeWindow = this.closeWindow.bind(this);
  }

  render() {
    return (
      <Row className="topbar">
        <Col xs="2" className="topBarLogoCol text-center">
          <ReactSVG path="img/logo.svg" className="logo" />
        </Col>
        <Col xs="8" className="topbarMiddle" />
        <Col xs="1" className="text-right topbarOptionsCol">
          <div className="windowButton" onClick={this.minimiseWindow}>
            <ReactSVG path="img/minimise.svg" />
          </div>
        </Col>
        <Col xs="1" className="text-left topbarOptionsCol">
          <div className="windowButton" onClick={this.closeWindow}>
            <ReactSVG path="img/close.svg" />
          </div>
        </Col>
      </Row>
    );
  }
}
