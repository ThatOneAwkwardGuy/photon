import React, { Component } from 'react';
import { ListGroup, ListGroupItem, Container, Collapse, Row, Col, Card, CardImg, CardBody } from 'reactstrap';
import { CSSTransition } from 'react-transition-group';
import { firestore } from '../api/firebase';
import Sizes from '../store/sizes';
var moment = require('moment');

export default class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      launchDetails: [],
      launchArray: [],
      gettingLaunchDetails: false
    };
  }

  componentDidMount() {
    this.getLaunchDetails();
  }

  getLaunchDetails = async () => {
    if (this.state.launchDetails.length === 0) {
      this.setState({
        gettingLaunchDetails: true
      });
      const launchDetailsRef = await firestore.returnHypedReleasesWithinNextWeek();
      this.setState({
        ...this.state,
        launchDetails: launchDetailsRef.docs,
        launchArray: Array.apply(null, Array(launchDetailsRef.docs.length)).map(function() {
          return false;
        }),
        gettingLaunchDetails: false
      });
    }
  };

  addNewTask = store => {
    let task = {
      mode: 'url',
      modeInput: '',
      keywords: '',
      proxy: '',
      size: Sizes['Shoes(UK/US)'][0],
      quantity: '1',
      profile: this.props.profiles[Object.keys(this.props.profiles)[0]].profileID,
      tasks: '1',
      color: '',
      category: 'Accessories',
      scheduledTime: '',
      atcBypass: false,
      captchaBypass: false
    };
    let newTask = { ...task, ...store };
    const profile = this.props.profiles[0];
    this.props.onAddTask({ task: newTask, profileID: this.props.profiles[Object.keys(this.props.profiles)[0]].profileID });
  };

  toggle = index => {
    this.setState({
      ...this.state,
      launchArray: this.state.launchArray.map((release, releaseIndex) => (releaseIndex === index ? !this.state.launchArray[releaseIndex] : this.state.launchArray[releaseIndex]))
    });
  };
  render() {
    return (
      <CSSTransition in={true} appear={true} timeout={300} classNames="fade">
        <Col className="active">
          <Container>
            <Row>
              <Col className="rightSidebar" xs="6">
                <h6 className="text-center">upcoming releases in the next week</h6>
                <Container>
                  <Row>
                    {this.state.launchArray.length > 0 ? (
                      this.state.launchDetails.map((element, index) => {
                        const data = element.data();
                        return (
                          <Card
                            key={`release-${index}`}
                            className="col-sm-4 releaseCard"
                            onClick={() => {
                              this.toggle(index);
                            }}
                          >
                            <Collapse isOpen={!this.state.launchArray[index]}>
                              <figure className="tint">
                                <CardImg top width="100%" src={data.image} className="releaseCardImg" alt="Card image cap" />
                              </figure>
                              <CardBody>{data.name}</CardBody>
                              <CardBody>{moment.unix(data.releaseDate.seconds).format('dddd, MMMM Do YYYY')}</CardBody>
                            </Collapse>
                            <Collapse isOpen={this.state.launchArray[index]}>
                              <ListGroup className="releaseStoresList">
                                {data.taskData !== undefined && Object.keys(data.taskData).length > 0 ? (
                                  data.taskData.map((store, index) => {
                                    return (
                                      <ListGroupItem
                                        onClick={() => {
                                          this.addNewTask(store);
                                        }}
                                        key={`store-${index}`}
                                      >
                                        {store.store}
                                      </ListGroupItem>
                                    );
                                  })
                                ) : (
                                  <ListGroupItem key={`store-${index}`}>No stores currently available</ListGroupItem>
                                )}
                              </ListGroup>
                            </Collapse>
                          </Card>
                        );
                      })
                    ) : this.state.gettingLaunchDetails ? (
                      ''
                    ) : (
                      <CardBody>There currently doesnt seem to be any upcoming releases, you can use the discord to find out about other releases.</CardBody>
                    )}
                  </Row>
                </Container>
              </Col>
            </Row>
          </Container>
        </Col>
      </CSSTransition>
    );
  }
}
