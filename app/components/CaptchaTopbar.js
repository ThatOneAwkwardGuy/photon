import React, { Component } from 'react';
import { Row, Col } from 'reactstrap';
import { remote } from 'electron';
import Minimize from '../img/svg/minimise.svg';
import Close from '../img/svg/close.svg';
export default class CaptchaTopbar extends Component {
  minimiseWindow = () => {
    remote.getCurrentWindow().minimize();
  };

  closeWindow = () => {
    remote.getCurrentWindow().close();
  };

  constructor() {
    super();
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
