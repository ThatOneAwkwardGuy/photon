import React, { Component } from "react";
import { Container, Row, Col, Button, Form, FormGroup, Label, Input } from "reactstrap";
import { CSSTransition } from "react-transition-group";

export default class Settings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      settings: {
        monitorTime: 0,
        errorTime: 0,
        checkoutTime: 0,
        monitorProxies: ""
      }
    };
  }

  componentDidMount() {
    this.initialize();
  }

  handleChange = e => {
    this.setState({
      ...this.state,
      settings: { ...this.state.settings, [e.target.name]: e.target.value }
    });
  };

  handleUpdateSettings = () => {
    this.setState(
      {
        ...this.state,
        settings: {
          ...this.state.settings,
          monitorProxies: monitorProxies.length > 0 ? this.state.settings.monitorProxies.trim() : ""
        }
      },
      () => {
        this.props.onUpdateSettings(this.state.settings);
      }
    );
  };

  initialize() {
    this.setState({
      ...this.state,
      settings: this.props.settings
    });
  }

  render() {
    return (
      <CSSTransition in={true} appear={true} timeout={300} classNames="fade">
        <Col className="activeContainerInner">
          <Container>
            <Row>
              <Col xs="12">
                <h6>delay times</h6>
                <Form>
                  <FormGroup row>
                    <Col xs="3">
                      <Label for="monitorTime">monitor delay(ms)</Label>
                      <Input
                        type="number"
                        name="monitorTime"
                        id="monitorTime"
                        value={this.state.settings.monitorTime}
                        onChange={event => {
                          this.handleChange(event);
                        }}
                      />
                    </Col>
                  </FormGroup>
                  <FormGroup row>
                    <Col xs="3">
                      <Label for="errorTime">error delay(ms)</Label>
                      <Input
                        type="number"
                        name="errorTime"
                        id="errorTime"
                        value={this.state.settings.errorTime}
                        onChange={event => {
                          this.handleChange(event);
                        }}
                      />
                    </Col>
                  </FormGroup>
                  <FormGroup row>
                    <Col xs="3">
                      <Label for="checkoutTime">checkout delay(ms)</Label>
                      <Input
                        type="number"
                        name="checkoutTime"
                        id="checkoutTime"
                        value={this.state.settings.checkoutTime}
                        onChange={event => {
                          this.handleChange(event);
                        }}
                      />
                    </Col>
                  </FormGroup>
                  <FormGroup row>
                    <Col xs="12">
                      <Label for="monitorProxies">monitor proxies</Label>
                      <Input
                        type="textarea"
                        name="monitorProxies"
                        id="monitorProxies"
                        value={this.state.settings.monitorProxies}
                        placeholder="http://user:pass@ip:port"
                        onChange={event => {
                          this.handleChange(event);
                        }}
                      />
                    </Col>
                  </FormGroup>
                  <FormGroup>
                    <Button
                      onClick={() => {
                        this.handleUpdateSettings();
                      }}
                    >
                      save
                    </Button>
                  </FormGroup>
                </Form>
              </Col>
            </Row>
          </Container>
        </Col>
      </CSSTransition>
    );
  }
}
