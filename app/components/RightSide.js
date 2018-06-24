import React, { Component } from 'react';
import { Col, Card, CardImg, CardBody } from 'reactstrap';
import { firestore } from '../api/firebase';
export default class RightSide extends Component {
  constructor(props) {
    super(props);
    this.getLaunchDetails();
    this.state = {
      launchDetails: []
    };
  }

  getLaunchDetails = async () => {
    const launchDetailsRef = await firestore.returnHypedReleasesWithinNextWeek();
    this.setState({
      launchDetails: launchDetailsRef.docs
    });
  };

  render() {
    return (
      <Col className="rightSidebar" xs="2">
        <h6 className="text-center">upcoming releases</h6>
        {this.state.launchDetails.map((element, index) => {
          const data = element.data();
          console.log(data);
          return (
            <Card key={index}>
              <CardImg top width="100%" src={data.image} alt="Card image cap" />
              <CardBody>{data.name}</CardBody>
            </Card>
          );
        })}
      </Col>
    );
  }
}
