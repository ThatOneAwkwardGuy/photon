import React, { Component } from 'react';
import { Button, Table, Container, Row, Col, Input, Label, Form, FormGroup } from 'reactstrap';
import { CSSTransition } from 'react-transition-group';

const rp = require('request-promise');

export default class Proxies extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.handleProxies = this.handleProxies.bind(this);
    this.handleAddProxies = this.handleAddProxies.bind(this);
    this.state = {
      proxyInput: '',
      proxyPings: [],
      proxySite: 'http://google.com'
    };
  }

  componentDidMount() {
    this.initialize();
  }

  handleAddProxies(proxies) {
    const validProxies = [];
    for (const proxy of proxies) {
      if (proxy.ping !== 'error') {
        validProxies.push(proxy);
      }
    }
    this.props.onAddProxies(validProxies);
  }

  deleteAllProxies = () => {
    this.props.onDeleteAllProxies();
  };

  initialize() {
    this.setState(
      {
        ...this.state,
        proxyPings: this.props.proxies
      },
      () => {
        this.setProxyInput();
      }
    );
  }

  setProxyInput = () => {
    let proxiesArray = [];
    for (const proxy of this.state.proxyPings) {
      if (proxy.user === 'none' && proxy.pass === 'none') {
        proxiesArray.push(`${proxy.ip}:${proxy.port}`);
      } else {
        proxiesArray.push(`${proxy.user}:${proxy.pass}:${proxy.ip}:${proxy.port}`);
      }
    }
    const proxiesList = proxiesArray.join('\n');
    this.setState({
      ...this.state,
      proxyInput: proxiesList
    });
  };

  returnProxyRow = (proxy, index) => (
    <tr key={`proxy-${index}`}>
      <td>{index}</td>
      <td>{proxy.ip}</td>
      <td>{proxy.port}</td>
      <td>{proxy.user}</td>
      <td>{proxy.pass}</td>
      <td>{proxy.ping}</td>
    </tr>
  );

  handleChange(e) {
    this.setState({
      [e.target.name]: e.target.value
    });
  }

  async handleProxies() {
    if (this.state.proxyInput !== '') {
      const splitProxies = this.state.proxyInput.split('\n');
      this.setState({
        proxyPings: []
      });
      splitProxies.forEach(async proxyItem => {
        const split = proxyItem.split(':');
        try {
          const responsePing = await rp({
            method: 'GET',
            time: true,
            resolveWithFullResponse: true,
            uri: this.state.proxySite,
            proxy: split.length === 4 ? `http://${split[0]}:${split[1]}@${split[2]}:${split[3]}` : split.length === 2 ? `http://${split[0]}:${split[1]}` : ''
          });
          if (split.length === 4) {
            this.setState({
              proxyPings: [
                ...this.state.proxyPings,
                {
                  user: split[0],
                  pass: split[1],
                  ip: split[2],
                  port: split[3],
                  ping: Math.round(responsePing.timings.response)
                }
              ]
            });
          } else if (split.length === 2) {
            this.setState({
              proxyPings: [
                ...this.state.proxyPings,
                {
                  user: 'none',
                  pass: 'none',
                  ip: split[0],
                  port: split[1],
                  ping: Math.round(responsePing.timings.response)
                }
              ]
            });
          }
        } catch (e) {
          if (split.length === 4) {
            this.setState({
              proxyPings: [
                ...this.state.proxyPings,
                {
                  user: split[0],
                  pass: split[1],
                  ip: split[2],
                  port: split[3],
                  ping: 'error'
                }
              ]
            });
          } else if (split.length === 2) {
            this.setState({
              proxyPings: [
                ...this.state.proxyPings,
                {
                  user: 'none',
                  pass: 'none',
                  ip: split[0],
                  port: split[1],
                  ping: 'error'
                }
              ]
            });
          }
        }
      });
    }
  }

  render() {
    return (
      <CSSTransition in={true} appear={true} timeout={300} classNames="fade">
        <Col className="tableContainer activeContainerInner">
          <Table responsive hover className="text-center">
            <thead>
              <tr>
                <th>#</th>
                <th>ip</th>
                <th>port</th>
                <th>user</th>
                <th>pass</th>
                <th>ping</th>
              </tr>
            </thead>
            <tbody>{this.state.proxyPings.map(this.returnProxyRow)}</tbody>
          </Table>
          <Container>
            <Row>
              <Col xs="6">
                <FormGroup>
                  <Label>proxies</Label>
                  <Input
                    name="proxyInput"
                    type="textarea"
                    id="proxyInput"
                    placeholder="user:pass:ip:port or ip:port"
                    value={this.state.proxyInput}
                    onChange={event => {
                      this.handleChange(event);
                    }}
                  />
                </FormGroup>
                <FormGroup row>
                  <div className="col-sm-4 text-center">
                    <Button
                      onClick={() => {
                        this.handleProxies();
                      }}
                    >
                      Test Proxies
                    </Button>
                  </div>
                  <div className="col-sm-4 text-center">
                    <Button
                      onClick={async () => {
                        this.handleAddProxies(this.state.proxyPings);
                      }}
                    >
                      Save Proxies
                    </Button>
                  </div>
                  <div className="col-sm-4 text-center">
                    <Button
                      onClick={async () => {
                        this.deleteAllProxies();
                        this.setState({
                          proxyInput: '',
                          proxyPings: [],
                          proxySite: 'http://google.com'
                        });
                      }}
                    >
                      Clear Proxies
                    </Button>
                  </div>
                </FormGroup>
              </Col>
              <Col xs="6">
                <FormGroup>
                  <Label>site</Label>
                  <Input
                    name="proxySite"
                    type="text"
                    id="proxySite"
                    value={this.state.proxySite}
                    placeholder="http://google.com"
                    onChange={event => {
                      this.handleChange(event);
                    }}
                  />
                </FormGroup>
              </Col>
            </Row>
          </Container>
        </Col>
      </CSSTransition>
    );
  }
}
