import React, { Component } from 'react';
import { Row, Col, Button } from 'reactstrap';
import { BounceLoader } from 'react-spinners';

export default class Waiting extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Row className="align-items-center" id="waitingWindow" style={{ display: this.props.visible ? 'flex' : 'none' }}>
        <Col>
          <h1 style={{ marginBottom: '50px' }}>Waiting</h1>
          <BounceLoader sizeUnit={'px'} size={200} color={'#03a9f4'} loading={this.props.visible} />
        </Col>
      </Row>
    );
  }
}
