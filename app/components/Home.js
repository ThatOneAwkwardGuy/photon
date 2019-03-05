import React, { Component } from 'react';
import {
  ListGroup,
  ListGroupItem,
  Container,
  Button,
  Collapse,
  Row,
  Col,
  Card,
  CardImg,
  CardBody,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from 'reactstrap';
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
      gettingLaunchDetails: false,
      currentLaunchInfo: {
        image: '',
        launchInfo: {
          description: '',
          colors: '',
          price: '',
          keywords: ''
        }
      },
      launchInfoModal: false
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

  returnTaskButton = task => {
    return (
      <Button
        onClick={() => {
          this.addNewTask(task);
        }}
        style={{ marginBottom: '10px', marginRight: '10px' }}
        key={`key-${task.store}`}
      >
        {task.store}
      </Button>
    );
  };

  addNewTask = store => {
    let task = {
      mode: 'url',
      modeInput: '',
      keywords: '',
      proxy: '',
      size: Sizes['Shoes(UK/US)'][0],
      quantity: '1',
      tasks: '1',
      color: '',
      keywordColor: '',
      category: 'Accessories',
      scheduledTime: '',
      atcBypass: false,
      captchaBypass: false,
      monitorDelay: '',
      checkoutDelay: '',
      username: '',
      password: '',
      profile: this.props.profiles[Object.keys(this.props.profiles)[0]].profileID
    };
    let newTask = { ...task, ...store };
    const profile = this.props.profiles[0];
    this.props.onAddTask({ task: newTask, profileID: this.props.profiles[Object.keys(this.props.profiles)[0]].profileID });
  };

  toggle = () => {
    this.setState({ launchInfoModal: !this.state.launchInfoModal }, () => {});
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
                              this.setState(
                                {
                                  currentLaunchInfo: data
                                },
                                () => {
                                  this.toggle();
                                }
                              );
                            }}
                          >
                            <figure className="tint">
                              <CardImg top width="100%" src={data.image} className="releaseCardImg" alt="Card image cap" />
                            </figure>
                            <CardBody>{data.name}</CardBody>
                            <CardBody>{moment.unix(data.releaseDate.seconds).format('dddd, MMMM Do YYYY')}</CardBody>
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
          <Modal isOpen={this.state.launchInfoModal} toggle={this.toggle} className={this.props.className} size="md">
            <ModalHeader toggle={this.toggle}>{this.state.currentLaunchInfo.name}</ModalHeader>
            <ModalBody>
              {this.state.currentLaunchInfo.image ? (
                <div>
                  <CardImg top width="100%" src={this.state.currentLaunchInfo.image} className="releaseCardImg" alt="Card image cap" />
                </div>
              ) : (
                ''
              )}
              {this.state.currentLaunchInfo.launchInfo.description ? (
                <div className="launchInfoSection">
                  <h5>Description</h5> {this.state.currentLaunchInfo.launchInfo.description}
                </div>
              ) : (
                ''
              )}
              {this.state.currentLaunchInfo.launchInfo.colours ? (
                <div className="launchInfoSection">
                  <h5>Colors</h5> {this.state.currentLaunchInfo.launchInfo.colours}
                </div>
              ) : (
                ''
              )}
              {this.state.currentLaunchInfo.launchInfo.price ? (
                <div className="launchInfoSection">
                  <h5>Price</h5> {this.state.currentLaunchInfo.launchInfo.price}
                </div>
              ) : (
                ''
              )}
              {this.state.currentLaunchInfo.launchInfo.keywords ? (
                <div className="launchInfoSection">
                  <h5>Recommended Keywords</h5> {this.state.currentLaunchInfo.launchInfo.keywords}
                </div>
              ) : (
                ''
              )}
              {this.state.currentLaunchInfo.taskData ? (
                <div className="launchInfoSection">
                  <h5>Add Task</h5> {this.state.currentLaunchInfo.taskData.map(task => this.returnTaskButton(task))}
                </div>
              ) : (
                ''
              )}
            </ModalBody>
            {/* <ModalFooter>
              <Button color="primary" onClick={this.toggle}>
                Do Something
              </Button>{' '}
              <Button color="secondary" onClick={this.toggle}>
                Cancel
              </Button>
            </ModalFooter> */}
          </Modal>
        </Col>
      </CSSTransition>
    );
  }
}
