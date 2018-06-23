// @flow
import React, { Component } from "react";
import { Row, Col } from "reactstrap";
import { remote } from "electron";
import Minimize from "../img/minimise.svg";
import Close from "../img/close.svg";
export default class CaptchaTopbar extends Component {
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
      <Row className="captchaTopbar">
        <Col xs="11" className="text-right topbarOptionsCol">
          <div className="windowButton" onClick={this.minimiseWindow}>
            <img src={Minimize} />
          </div>
        </Col>
        <Col xs="1" className="text-left topbarOptionsCol">
          <div className="windowButton" onClick={this.closeWindow}>
            <img src={Close} />
          </div>
        </Col>
      </Row>
    );
  }
}
