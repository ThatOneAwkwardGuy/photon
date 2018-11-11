import React, { Component } from 'react';
import { Container, Row, Col, Button, Form, FormGroup, Label, Input } from 'reactstrap';
import { CSSTransition } from 'react-transition-group';
import stores from '../store/shops';
import Sizes from '../store/sizes';
import Datetime from 'react-datetime';
import Toggle from 'react-toggle';
import 'react-toggle/style.css';
const _ = require('lodash');
const moment = require('moment');
const Shops = _.keys(stores);

class AddTask extends Component {
  constructor(props) {
    super(props);
    this.profileNames = _.keys(this.props.profiles);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.returnProfileName = this.returnProfileName.bind(this);
    this.state = {
      scheduledTimeFlag: false,
      formdata: {
        store: Shops[0],
        mode: 'url',
        modeInput: '',
        keywords: '',
        proxy: '',
        size: Sizes['Shoes(UK/US)'][0],
        quantity: '1',
        profile: this.profileNames[0],
        tasks: '1',
        color: '',
        keywordColor: '',
        category: 'Accessories',
        scheduledTime: '',
        atcBypass: false,
        captchaBypass: false,
        monitorDelay: '',
        checkoutDelay: ''
      }
    };
  }

  addTaskForProfile = profileID => {
    if (this.state.formdata.size === 'Random Shoe Size') {
      this.state.formdata.size = Sizes['Shoes(UK/US)'].slice(1)[Math.floor(Math.random() * Sizes['Shoes(UK/US)'].slice(1).length)];
    }
    const task = {
      task: this.state.formdata,
      profileID: profileID
    };
    this.props.onAddTask(task);
  };

  toggleScheduledTime = () => {
    this.setState({
      scheduledTimeFlag: !this.state.scheduledTimeFlag,
      formdata: { ...this.state.formdata, scheduledTime: '' }
    });
  };

  handleChange(e) {
    if (e.target.value.includes('Supreme')) {
      this.setState({
        formdata: Object.assign({}, this.state.formdata, {
          [e.target.name]: e.target.value,
          mode: 'keywords'
        })
      });
    } else {
      this.setState({
        formdata: Object.assign({}, this.state.formdata, {
          [e.target.name]: e.target.value
        })
      });
    }
  }

  handleSubmit() {
    if (this.state.formdata.size === 'Random Shoe Size') {
      this.state.formdata.size = Sizes['Shoes(UK/US)'].slice(1)[Math.floor(Math.random() * Sizes['Shoes(UK/US)'].slice(1).length)];
    }
    const task = {
      task: this.state.formdata,
      profileID: this.state.formdata.profile
    };
    this.props.onAddTask(task);
  }

  returnProfileName = (name, index) => <option key={`profile-${index}`}>{name}</option>;

  returnOptions = (name, index) => <option key={`shop-${index}`}>{name}</option>;

  setScheduledTime = date => {
    this.setState({
      formdata: {
        ...this.state.formdata,
        scheduledTime: date
      }
    });
  };

  returnSizeOptions = object => {
    let tree = [];
    for (const group in object) {
      tree.push(
        <optgroup key={`optgroup-${group}`} label={`${group}`}>
          {object[group].map(this.returnOptions)}
        </optgroup>
      );
    }
    return tree;
  };

  render() {
    return (
      <CSSTransition in={true} appear={true} timeout={300} classNames="fade">
        <Col className="activeContainerInner">
          <Container>
            <Row>
              <Col xs="12">
                <Form>
                  <FormGroup row>
                    <Col xs="3">
                      <Label for="store">store</Label>
                      <Input
                        type="select"
                        name="store"
                        id="store"
                        value={this.state.formdata.store}
                        onChange={event => {
                          this.handleChange(event);
                        }}
                      >
                        {Shops.map(this.returnOptions)}
                      </Input>
                    </Col>
                  </FormGroup>
                  <FormGroup row>
                    {this.state.formdata.store.includes('Supreme') ? (
                      ''
                    ) : (
                      <Col xs="3">
                        <Label for="mode">mode</Label>
                        <Input
                          type="select"
                          name="mode"
                          id="mode"
                          value={this.state.formdata.mode}
                          onChange={event => {
                            this.handleChange(event);
                          }}
                        >
                          <option>url</option>
                          <option>keywords</option>
                          <option>variant</option>
                          <option>homepage</option>
                        </Input>
                      </Col>
                    )}
                    {this.state.formdata.mode !== 'keywords' ? (
                      <Col xs="9">
                        <Label for="modeInput">
                          {this.state.formdata.mode === 'url'
                            ? 'url'
                            : this.state.formdata.mode === 'keywords'
                            ? 'keywords'
                            : this.state.formdata.mode === 'variant'
                            ? 'variant'
                            : this.state.formdata.mode === 'homepage'
                            ? 'homepage url'
                            : ''}
                        </Label>
                        <Input
                          type="text"
                          name="modeInput"
                          id="modeInput"
                          value={this.state.formdata.modeInput}
                          // placeholder="e.g +yeezy or http://example.com or variantID"
                          placeholder={
                            this.state.formdata.mode === 'url'
                              ? 'http://example.com'
                              : this.state.formdata.mode === 'keywords'
                              ? '+yeezy -nike'
                              : this.state.formdata.mode === 'variant'
                              ? 'variantID'
                              : this.state.formdata.mode === 'homepage'
                              ? 'homepage url'
                              : ''
                          }
                          onChange={event => {
                            this.handleChange(event);
                          }}
                        />
                      </Col>
                    ) : (
                      ''
                    )}
                    {this.state.formdata.mode === 'homepage' || this.state.formdata.mode === 'keywords' ? (
                      <CSSTransition in={true} appear={true} timeout={300} classNames="fade">
                        <Col xs="9" style={{ marginTop: this.state.formdata.mode === 'homepage' ? '1rem' : '' }}>
                          <Label for="keywords">keywords</Label>
                          <Input
                            type="text"
                            name="keywords"
                            id="keywords"
                            value={this.state.formdata.keywords}
                            placeholder="+nikeBoyzWeDontDo3Stripes -adidas"
                            onChange={event => {
                              event.target.value = event.target.value.toLowerCase();
                              this.handleChange(event);
                            }}
                          />
                        </Col>
                      </CSSTransition>
                    ) : (
                      ''
                    )}
                  </FormGroup>
                  <FormGroup row>
                    <Col xs="4">
                      <Label for="proxy">proxy (optional)</Label>
                      <Input
                        type="text"
                        name="proxy"
                        id="proxy"
                        value={this.state.formdata.proxy}
                        placeholder="user:pass@0.0.0.0:port or 0.0.0.0:port"
                        onChange={event => {
                          this.handleChange(event);
                        }}
                      />
                    </Col>
                    <Col xs="4">
                      <Label for="monitorDelay">monitor delay (ms)(optional)</Label>
                      <Input
                        type="number"
                        name="monitorDelay"
                        id="monitorDelay"
                        value={this.state.formdata.monitorDelay}
                        placeholder=""
                        onChange={event => {
                          this.handleChange(event);
                        }}
                      />
                    </Col>
                    {this.state.formdata.store.includes('Supreme') ? (
                      <CSSTransition in={true} appear={true} timeout={300} classNames="fade">
                        <Col xs="4">
                          <Label for="checkoutDelay">checkout delay (ms)(optional)</Label>
                          <Input
                            type="number"
                            name="checkoutDelay"
                            id="checkoutDelay"
                            value={this.state.formdata.checkoutDelay}
                            placeholder=""
                            onChange={event => {
                              this.handleChange(event);
                            }}
                          />
                        </Col>
                      </CSSTransition>
                    ) : (
                      ''
                    )}
                  </FormGroup>
                  <FormGroup row>
                    {this.state.formdata.mode !== 'variant' ? (
                      <CSSTransition in={true} appear={true} timeout={300} classNames="fade">
                        <Col xs="3">
                          <Label for="size">size</Label>
                          <Input
                            type="select"
                            name="size"
                            id="size"
                            value={this.state.formdata.size}
                            onChange={event => {
                              this.handleChange(event);
                            }}
                          >
                            {this.returnSizeOptions(Sizes)}
                          </Input>
                        </Col>
                      </CSSTransition>
                    ) : (
                      ''
                    )}
                    {this.state.formdata.mode !== 'variant' && !this.state.formdata.store.includes('Supreme') ? (
                      <CSSTransition in={true} appear={true} timeout={300} classNames="fade">
                        <Col xs="3">
                          <Label for="keywordColor">color</Label>
                          <Input
                            type="text"
                            name="keywordColor"
                            id="keywordColor"
                            value={this.state.formdata.keywordColor}
                            onChange={event => {
                              this.handleChange(event);
                            }}
                          />
                        </Col>
                      </CSSTransition>
                    ) : (
                      ''
                    )}
                    {this.state.formdata.store.includes('Supreme') ? (
                      <CSSTransition in={true} appear={true} timeout={300} classNames="fade">
                        <Col xs="3">
                          <Label for="category">category</Label>
                          <Input
                            type="select"
                            name="category"
                            id="category"
                            value={this.state.formdata.category}
                            onChange={event => {
                              this.handleChange(event);
                            }}
                          >
                            <option>Accessories</option>
                            <option>Bags</option>
                            <option>Hats</option>
                            <option>Jackets</option>
                            <option>Pants</option>
                            <option>Shirts</option>
                            <option>Shoes</option>
                            <option>Shorts</option>
                            <option>Skate</option>
                            <option>Sweatshirts</option>
                            <option>T-Shirts</option>
                            <option>Tops/Sweaters</option>
                            <option>new</option>
                          </Input>
                        </Col>
                      </CSSTransition>
                    ) : (
                      ''
                    )}
                    <Col xs="3">
                      <Label for="quantity">quantity</Label>
                      <Input
                        type="select"
                        name="quantity"
                        id="quantity"
                        value={this.state.formdata.quantity}
                        onChange={event => {
                          this.handleChange(event);
                        }}
                      >
                        <option>1</option>
                        <option>2</option>
                        <option>3</option>
                        <option>4</option>
                        <option>5</option>
                        <option>6</option>
                        <option>7</option>
                        <option>8</option>
                        <option>9</option>
                      </Input>
                    </Col>
                  </FormGroup>
                  <FormGroup row>
                    <Col xs="6">
                      <Label>
                        <span>Schedule Time (Optional)</span>
                        <Toggle checked={this.state.scheduledTimeFlag} onChange={this.toggleScheduledTime} />
                      </Label>
                      {this.state.scheduledTimeFlag ? (
                        <CSSTransition in={true} appear={true} timeout={300} classNames="fade">
                          <Datetime
                            value={
                              this.state.formdata.scheduledTime === '' ? moment.unix((Date.now() / 1000) | 0) : moment.unix(this.state.formdata.scheduledTime)
                            }
                            dateFormat="dddd, MMMM Do YYYY"
                            timeFormat="HH:mm:ss A"
                            isValidDate={(currentDate, selectedDate) => {
                              if (currentDate >= Date.now() - 24 * 60 * 60 * 1000) {
                                return true;
                              }
                            }}
                            onChange={date => {
                              this.setScheduledTime(date.unix());
                            }}
                          />
                        </CSSTransition>
                      ) : (
                        ''
                      )}

                      {this.state.scheduledTimeFlag ? (
                        <CSSTransition in={true} appear={true} timeout={300} classNames="fade">
                          <Button
                            style={{ marginTop: '30px', float: 'right' }}
                            onClick={() => {
                              this.setState({
                                formdata: {
                                  ...this.state.formdata,
                                  scheduledTime: ''
                                }
                              });
                            }}
                          >
                            Clear Time
                          </Button>
                        </CSSTransition>
                      ) : (
                        ''
                      )}
                    </Col>
                  </FormGroup>
                  <FormGroup row>
                    <Col xs="3">
                      <Label for="profile">profile</Label>
                      <Input
                        type="select"
                        name="profile"
                        id="profile"
                        value={this.state.formdata.profile}
                        onChange={event => {
                          this.handleChange(event);
                        }}
                      >
                        {this.profileNames.map(this.returnProfileName)}
                      </Input>
                    </Col>
                    {this.state.formdata.store.includes('Supreme') ? (
                      <Col xs="3">
                        <Label for="profile">color</Label>
                        <Input
                          type="text"
                          name="color"
                          id="color"
                          value={this.state.formdata.color}
                          onChange={event => {
                            this.handleChange(event);
                          }}
                        />
                      </Col>
                    ) : (
                      ''
                    )}
                    <Col xs="3">
                      <Label for="tasks">tasks</Label>
                      <Input
                        type="number"
                        name="tasks"
                        id="tasks"
                        value={this.state.formdata.tasks}
                        onChange={event => {
                          this.handleChange(event);
                        }}
                      />
                    </Col>
                  </FormGroup>
                  <FormGroup row style={{ marginTop: '2rem', marginBottom: '2rem' }}>
                    {this.state.formdata.store.includes('Supreme') ? (
                      <Col xs="3" className="text-center">
                        <Label for="tasks" className="align-items-center" check>
                          ATC Bypass
                          <Input
                            type="checkbox"
                            name="atcBypass"
                            id="atcBypass"
                            style={{ WebkitAppearance: 'checkbox', marginLeft: '15px' }}
                            value={this.state.formdata.atcBypass}
                            checked={this.state.formdata.atcBypass === true}
                            onChange={() => {
                              this.setState({
                                formdata: {
                                  ...this.state.formdata,
                                  atcBypass: !this.state.formdata.atcBypass
                                }
                              });
                            }}
                          />
                        </Label>
                      </Col>
                    ) : (
                      ''
                    )}
                    {/* {this.state.formdata.store.includes('Supreme') ? (
                      <Col xs="3" className="text-center">
                        <Label for="tasks" className="align-items-center" check>
                          Captcha Bypass
                          <Input
                            type="checkbox"
                            name="captchaBypass"
                            id="captchaBypass"
                            style={{ WebkitAppearance: 'checkbox', marginLeft: '15px' }}
                            value={this.state.formdata.captchaBypass}
                            checked={this.state.formdata.captchaBypass === true}
                            onChange={() => {
                              this.setState({
                                formdata: {
                                  ...this.state.formdata,
                                  captchaBypass: !this.state.formdata.captchaBypass
                                }
                              });
                            }}
                          />
                        </Label>
                      </Col>
                    ) : (
                      ''
                    )} */}
                  </FormGroup>
                  <FormGroup row>
                    <Col xs="2">
                      <Button
                        onClick={() => {
                          for (let i = 0; i < parseInt(this.state.formdata.tasks); i++) {
                            this.handleSubmit();
                          }
                          this.setState({
                            formdata: {
                              store: Shops[0],
                              mode: 'url',
                              modeInput: '',
                              keywords: '',
                              proxy: '',
                              size: Sizes['Shoes(UK/US)'][0],
                              quantity: '1',
                              profile: this.profileNames[0],
                              tasks: '1',
                              color: '',
                              keywordColor: '',
                              category: 'Accessories',
                              scheduledTime: '',
                              atcBypass: false,
                              captchaBypass: false
                            }
                          });
                        }}
                      >
                        add task(s)
                      </Button>
                    </Col>
                    <Col xs="3">
                      {' '}
                      <Button
                        onClick={() => {
                          for (const profile in this.props.profiles) {
                            this.addTaskForProfile(profile);
                          }
                          this.setState({
                            formdata: {
                              store: Shops[0],
                              mode: 'url',
                              modeInput: '',
                              keywords: '',
                              proxy: '',
                              size: Sizes['Shoes(UK/US)'][0],
                              quantity: '1',
                              profile: this.profileNames[0],
                              tasks: '1',
                              color: '',
                              keywordColor: '',
                              category: 'Accessories',
                              scheduledTime: '',
                              atcBypass: false,
                              captchaBypass: false
                            }
                          });
                        }}
                      >
                        add task(s) for all profiles
                      </Button>
                    </Col>
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

export default AddTask;
