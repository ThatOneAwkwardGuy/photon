import React, { Component } from 'react';
import { Alert, Container, Row, Col, Button, Form, FormGroup, Label, Input } from 'reactstrap';
import Topbar from '../components/Topbar';
import Footer from '../components/Footer';
import { auth } from '../api/firebase/';
import Particles from 'react-particles-js';
import { setUserToCurrentlyInactive, setUserMachineIDOnFirstLoad, checkIfUserMachineIDMatches } from '../api/firebase/firestore';
import { BounceLoader } from 'react-spinners';

class Login extends Component {
  constructor(props) {
    super(props);
    if (location.hash === '#captcha') {
      this.props.history.push('/captcha');
    } else {
      this.checkLoggedIn();
    }
    this.state = {
      loginEmail: '',
      loginPassword: '',
      formError: false,
      loginError: false,
      currentlyLoggingIn: false
    };
    this.handleLogin = this.handleLogin.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.onDismiss = this.onDismiss.bind(this);
    window.onbeforeunload = e => {
      auth.authorise.onAuthStateChanged(user => {
        if (user) {
          setUserToCurrentlyInactive(user.uid);
        }
      });
    };
  }

  handleChange(e) {
    this.setState({
      [e.target.name]: e.target.value
    });
  }

  onDismiss() {
    this.setState({
      formError: false
    });
  }

  checkLoggedIn = async () => {
    await auth.authorise.onAuthStateChanged(async user => {
      if (user !== null) {
        this.setState({
          currentlyLoggingIn: true
        });
        await setUserMachineIDOnFirstLoad(user.uid);
        const machineIDStatus = await checkIfUserMachineIDMatches(user.uid);
        if (user && machineIDStatus) {
          this.props.history.push('/bot');
        } else {
          this.setState({
            loginError: true,
            currentlyLoggingIn: false
          });
        }
      }
    });
  };

  handleLogin = async () => {
    try {
      this.setState({
        currentlyLoggingIn: true
      });
      await auth.doSignInWithEmailAndPassword(this.state.loginEmail, this.state.loginPassword);
      await checkLoggedIn();
    } catch (e) {
      this.setState({
        formError: true,
        currentlyLoggingIn: false
      });
    }
  };

  render() {
    return (
      <div>
        <Particles
          params={{
            particles: {
              number: {
                value: 5,
                density: {
                  enable: true,
                  value_area: 800
                }
              },
              color: {
                value: '#ffffff'
              },
              shape: {
                type: 'edge',
                stroke: {
                  width: 0,
                  color: '#000000'
                }
              },
              opacity: {
                value: 1,
                random: true,
                anim: {
                  enable: true,
                  speed: 1,
                  opacity_min: 0,
                  sync: false
                }
              },
              size: {
                value: 3,
                random: true,
                anim: {
                  enable: false,
                  speed: 4,
                  size_min: 0.3,
                  sync: false
                }
              },
              line_linked: {
                enable: false
              },
              move: {
                enable: true,
                speed: 30,
                direction: 'top',
                random: true,
                straight: true,
                out_mode: 'out',
                bounce: false
              }
            },
            interactivity: {
              detect_on: 'canvas',
              events: {
                onhover: {
                  enable: true,
                  mode: 'bubble'
                },
                onclick: {
                  enable: false
                },
                resize: true
              },
              modes: {
                grab: {
                  distance: 400,
                  line_linked: {
                    opacity: 1
                  }
                },
                bubble: {
                  distance: 250,
                  size: 0,
                  duration: 2,
                  opacity: 0,
                  speed: 3
                },
                repulse: {
                  distance: 400,
                  duration: 0.4
                },
                push: {
                  particles_nb: 4
                },
                remove: {
                  particles_nb: 2
                }
              }
            },
            retina_detect: true
          }}
        />
        <Container fluid>
          <div className="loginTopBar">
            <Topbar />
          </div>
          <Row className="loginContainer">
            <Container>
              <Row>
                <Col xs="4">
                  <Alert color="danger" isOpen={this.state.formError} toggle={this.onDismiss}>
                    you may have entered the wrong details, please try again or contact us via the discord.
                  </Alert>
                  <Alert color="danger" isOpen={this.state.loginError}>
                    it appears there was a problem logging you in, this maybe be due to incorrect account info or you may already be logged in somewhere else.
                  </Alert>
                  <Form>
                    <FormGroup row>
                      <Col xs="12">
                        <Label>email</Label>
                        <Input
                          type="text"
                          name="loginEmail"
                          id="loginEmail"
                          onChange={e => {
                            this.handleChange(e);
                          }}
                        />
                      </Col>
                    </FormGroup>
                    <FormGroup row>
                      <Col xs="12">
                        <Label>password</Label>
                        <Input
                          type="password"
                          name="loginPassword"
                          id="loginPassword"
                          onChange={e => {
                            this.handleChange(e);
                          }}
                        />
                      </Col>
                    </FormGroup>
                    <FormGroup row>
                      <Col xs="4">
                        <Button
                          onClick={() => {
                            this.handleLogin();
                          }}
                          className="primaryButton"
                        >
                          login
                        </Button>
                      </Col>
                    </FormGroup>
                  </Form>
                </Col>
                <Col xm="8">
                  <BounceLoader color={'#03a9f4'} loading={this.state.currentlyLoggingIn} />
                </Col>
              </Row>
            </Container>
          </Row>
          <div className="loginFooter">
            <Footer type="login" />
          </div>
        </Container>
      </div>
    );
  }
}

export default Login;
