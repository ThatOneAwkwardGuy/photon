import React, { Component } from 'react';
import { Container, Row, Col, Button, Form, FormGroup, Label, Input, Table } from 'reactstrap';
import { CSSTransition } from 'react-transition-group';
import { auth } from '../api/firebase/index';
import Toggle from 'react-toggle';
import FontAwesome from 'react-fontawesome';
export default class Settings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      settings: {
        monitorTime: 0,
        errorTime: 0,
        checkoutTime: 0,
        restockMonitorTime: 0,
        monitorProxies: '',
        monitorForRestock: false,
        retryOnCheckoutError: false,
        customSites: {}
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
          monitorProxies: monitorProxies.length > 0 ? this.state.settings.monitorProxies.trim() : ''
        }
      },
      () => {
        this.props.onUpdateSettings(this.state.settings);
      }
    );
  };

  handleAddCustomSite = () => {
    this.props.onAddCustomSite({ name: this.state.settings.customSiteName, url: this.state.settings.customSiteUrl });
    this.setState({
      customSiteName: '',
      customSiteUrl: '',
      customSites: { ...this.state.customSites, [this.state.settings.customSiteName]: this.state.settings.customSiteUrl }
    });
  };

  initialize() {
    this.setState({
      ...this.state,
      settings: this.props.settings
    });
  }

  deleteCustomSite = site => {
    this.setState({
      ...this.state,
      settings: {
        ...this.state.settings,
        customSites: _.omit(this.state.settings.customSites, [site])
      }
    });
  };

  returnCustomSites(customSites) {
    const tree = [];
    for (const site in customSites) {
      tree.push(
        <tr key={`Custom Site - ${site}`}>
          <td>{site}</td>
          <td>{customSites[site]}</td>
          <td>
            <span
              onClick={() => {
                this.props.onRemoveCustomSite(site);
                this.deleteCustomSite(site);
              }}
              className="taskButton btn"
            >
              <FontAwesome name="trash" />
            </span>
          </td>
        </tr>
      );
    }
    return tree;
  }

  render() {
    return (
      <CSSTransition in={true} appear={true} timeout={300} classNames="fade">
        <Col className="activeContainerInner">
          <Container className="d-flex flex-column" style={{ height: '100%' }}>
            <Row className="d-flex flex-grow-1" style={{ overflowY: 'scroll' }}>
              <Col xs="12">
                <Form>
                  <h6 style={{ fontWeight: 600 }}>delay times</h6>
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
                    <Col xs="3">
                      <Label for="checkoutTime">restock monitor delay(ms)</Label>
                      <Input
                        type="number"
                        name="restockMonitorTime"
                        id="restockMonitorTime"
                        value={this.state.settings.restockMonitorTime}
                        onChange={event => {
                          this.handleChange(event);
                        }}
                      />
                    </Col>
                  </FormGroup>
                  <FormGroup row>
                    <Col xs="6">
                      <h6 style={{ fontWeight: 600 }}>monitor proxies</h6>
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
                    <Col xs="3">
                      <h6 style={{ fontWeight: 600 }}>retry for restocks </h6>
                      <Toggle
                        defaultChecked={this.props.settings.monitorForRestock}
                        onChange={() => {
                          this.setState({ settings: { ...this.state.settings, monitorForRestock: !this.state.settings.monitorForRestock } });
                        }}
                      />
                    </Col>
                    <Col xs="3">
                      <h6 style={{ fontWeight: 600 }}>retry on checkout error </h6>
                      <Toggle
                        defaultChecked={this.props.settings.retryOnCheckoutError}
                        onChange={() => {
                          this.setState({ settings: { ...this.state.settings, retryOnCheckoutError: !this.state.settings.retryOnCheckoutError } });
                        }}
                      />
                    </Col>
                  </FormGroup>
                  <FormGroup row>
                    <Col xs="12">
                      <h6 style={{ fontWeight: 600 }}>custom shopify sites</h6>
                      <Container>
                        <Table>
                          <thead>
                            <tr>
                              <th>site</th>
                              <th>url</th>
                              <th>actions</th>
                            </tr>
                          </thead>
                          <tbody style={{ fontWeight: '300' }}>{this.returnCustomSites(this.state.settings.customSites)}</tbody>
                        </Table>
                      </Container>
                      <Container>
                        <Row>
                          <Col xs="5">
                            <Label for="customSiteName">name</Label>
                            <Input
                              type="text"
                              name="customSiteName"
                              id="customSiteName"
                              placeholder="custom site"
                              value={this.state.settings.customSiteName}
                              onChange={event => {
                                this.handleChange(event);
                              }}
                            />
                          </Col>
                          <Col xs="5">
                            <Label for="customSiteUrl">url</Label>
                            <Input
                              type="text"
                              name="customSiteUrl"
                              id="customSiteUrl"
                              placeholder="http://example.com"
                              value={this.state.settings.customSiteUrl}
                              onChange={event => {
                                this.handleChange(event);
                              }}
                            />
                          </Col>
                          <Col xs="2" className="text-right align-items-end flex-row d-flex justify-content-end">
                            <Button
                              onClick={() => {
                                this.handleAddCustomSite();
                              }}
                            >
                              add
                            </Button>
                          </Col>
                        </Row>
                      </Container>
                    </Col>
                  </FormGroup>
                </Form>
              </Col>
            </Row>
            <Row>
              <Col>
                <Button
                  onClick={() => {
                    this.handleUpdateSettings();
                  }}
                >
                  save
                </Button>
              </Col>
              <Col className="text-right">
                <Button
                  onClick={() => {
                    auth.authorise.signOut();
                  }}
                >
                  sign out
                </Button>
              </Col>
            </Row>
          </Container>
        </Col>
      </CSSTransition>
    );
  }
}
