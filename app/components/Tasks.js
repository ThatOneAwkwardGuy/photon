import React, { Component } from 'react';
import { Button, Modal, ModalBody, ModalFooter, Table, Container, Row, Col, Form, FormGroup, Label, Input } from 'reactstrap';
import { CSSTransition } from 'react-transition-group';
import Modes from '../store/modeOptions';
import storeDropdown from '../store/siteDropdown';
import passwordSites from '../store/passwordSites';
import FontAwesome from 'react-fontawesome';
import stores from '../store/shops';
import Sizes from '../store/sizes';
import { RESET_CAPTCHA_TOKENS_ARRAY, RESET_CAPTCHA_WINDOW } from '../utils/constants';
import Datetime from 'react-datetime';
import Toggle from 'react-toggle';
import 'react-toggle/style.css';
var fs = require('fs');
var moment = require('moment');
const _ = require('lodash');
const Shops = _.keys(stores);
const { dialog } = require('electron').remote;
const ipcRenderer = require('electron').ipcRenderer;

export default class Tasks extends Component {
  constructor(props) {
    super(props);
    storeDropdown.custom = _.keys(props.settings.customSites);
    this.profileNames = _.keys(this.props.profiles);
    this.state = {
      scheduledTimeFlag: false,
      taskEditModal: false,
      deleteAllTasksModal: false,
      taskExportSuccess: false,
      taskExportFailure: false,
      taskImportFailure: false,
      modalFormData: {
        task: {
          store: Shops[0],
          mode: 'url',
          modeInput: '',
          keywords: '',
          proxy: '',
          size: Sizes[0],
          quantity: '1',
          profile: '',
          tasks: '1',
          color: '',
          scheduledTime: '',
          monitorDelay: '',
          checkoutDelay: ''
        },
        profileID: ''
      }
    };
  }

  componentDidMount = () => {
    this.props.reInitialize();
  };

  forceUpdateHandler = () => {
    this.forceUpdate();
  };

  toggleScheduledTime = () => {
    this.setState({
      scheduledTimeFlag: !this.state.scheduledTimeFlag,
      modalFormData: { ...this.state.modalFormData, task: { ...this.state.modalFormData.task, scheduledTime: '' } }
    });
  };

  returnOptions = (name, index, keyName) => <option key={`${keyName}-${index}`}>{name}</option>;

  handleSaveUpdatedTask = (task, id) => {
    this.props.onUpdateTask({ task, id });
  };

  handleChange = e => {
    if (e.target.value.includes('supreme')) {
      this.setState({
        modalFormData: {
          ...this.state.modalFormData,
          task: { ...this.state.modalFormData.task, [e.target.name]: e.target.value, mode: 'keywords' }
        }
      });
    } else if (e.target.name === 'store') {
      this.setState({
        modalFormData: {
          ...this.state.modalFormData,
          task: {
            ...this.state.modalFormData.task,
            [e.target.name]: e.target.value,
            mode: Modes[e.target.value] !== undefined ? Modes[e.target.value][0] : 'url'
          }
        }
      });
    } else if (e.target.name === 'profile') {
      this.setState({
        modalFormData: {
          ...this.state.modalFormData,
          profileID: e.target.value,
          task: { ...this.state.modalFormData.task, [e.target.name]: e.target.value }
        }
      });
    } else {
      this.setState({
        modalFormData: {
          ...this.state.modalFormData,
          task: { ...this.state.modalFormData.task, [e.target.name]: e.target.value }
        }
      });
    }
  };

  setScheduledTime = date => {
    this.setState({
      modalFormData: {
        ...this.state.modalFormData,
        task: { ...this.state.modalFormData.task, scheduledTime: date }
      }
    });
  };

  editTask = (index, task) => {
    this.setState(
      {
        scheduledTimeFlag: task.options.task.scheduledTime === '' ? false : true,
        modalFormData: { task: task.options.task, profileID: task.options.profileID },
        updateTaskID: index
      },
      () => {
        this.setState({
          taskEditModal: true
        });
      }
    );
  };

  returnProfileName = (name, index) => <option key={`profile-${index}`}>{name}</option>;

  toggle = () => {
    this.setState({
      taskEditModal: !this.state.taskEditModal
    });
  };

  toggleDeleteAllModal = () => {
    this.setState({
      deleteAllTasksModal: !this.state.deleteAllTasksModal
    });
  };

  startAllTasks = () => {
    // this.state.taskClasses.forEach(element => {
    //   element.run();
    // });
    // ipcRenderer.send(RESET_CAPTCHA_TOKENS_ARRAY, 'reset');
    for (const task of this.props.taskClasses) {
      task.run();
    }
  };

  stopAllTasks = () => {
    this.props.taskClasses.forEach(element => {
      element.stopTask();
    });
  };

  exportTasks = () => {
    const tasksArray = this.props.tasks;
    const JSONTask = JSON.stringify({ tasks: tasksArray });
    dialog.showSaveDialog(
      {
        title: 'photon_tasks',
        defaultPath: '~/photon_tasks.json',
        filters: [{ name: 'Photon Files', extensions: ['json'] }]
      },
      fileName => {
        if (fileName === undefined) {
          return;
        }
        fs.writeFile(fileName, JSONTask, err => {
          if (err) {
            this.setState({
              taskExportFailure: true
            });
            return;
          }
          this.setState({
            taskExportSuccess: true
          });
        });
      }
    );
  };

  importTasks = () => {
    dialog.showOpenDialog(
      {
        filters: [{ name: 'Photon Files', extensions: ['json'] }]
      },
      fileNames => {
        if (fileNames === undefined) {
          return;
        }
        fs.readFile(fileNames[0], 'utf-8', (err, data) => {
          if (err) {
            this.setState({
              taskImportFailure: true
            });
            return;
          }
          const tasksArray = JSON.parse(data).tasks;
          tasksArray.forEach(element => {
            this.props.onAddTask(element);
          });
        });
      }
    );
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

  returnModeOptions = option => {
    if (Modes[option] !== undefined) {
      return Modes[option].map((modeOption, index) => <option key={`mode-${index}`}>{modeOption}</option>);
    } else {
      return ['url', 'keywords', 'variant', 'homepage'].map((modeOption, index) => <option key={`mode-${index}`}>{modeOption}</option>);
    }
  };

  returnSizeOptions = object => {
    let tree = [];
    for (const group in object) {
      tree.push(
        <optgroup key={`optgroup-${group}`} label={`${group}`}>
          {object[group].map((name, index) => this.returnOptions(name, index, 'size'))}
        </optgroup>
      );
    }
    return tree;
  };

  returnSiteOptions = object => {
    let tree = [];
    for (const group in object) {
      tree.push(
        <optgroup key={`optgroup-${group}`} label={`${group}`}>
          {object[group].map((name, index) => this.returnOptions(name, index, 'site'))}
        </optgroup>
      );
    }
    return tree;
  };

  returnTasks = (task, index) => (
    <tr className="taskTableRow" key={`task-${index}`}>
      <td>{index + 1}</td>
      <td>{task.options.task.store}</td>
      <td>{task.options.profileID}</td>
      <td>{task.productName === '' ? (task.options.task.modeInput === '' ? task.options.task.keywords : task.options.task.modeInput) : task.productName}</td>
      <td>
        {task.options.task.scheduledTime === '' || task.options.task.scheduledTime === undefined
          ? 'manual'
          : moment.unix(task.options.task.scheduledTime).format('HH:mm:ss A dddd, D/MM/YY')}
      </td>
      <td>{task.options.task.size}</td>
      <td>{task.options.task.color === '' ? (task.options.task.keywordColor === '' ? 'n/a' : task.options.task.keywordColor) : task.options.task.color}</td>
      <td>{task.status}</td>
      <td>
        <span
          onClick={() => {
            task.run();
          }}
          className="taskButton btn"
        >
          <FontAwesome name="play" />
        </span>
        <span
          onClick={() => {
            ipcRenderer.send(RESET_CAPTCHA_WINDOW, 'reset');
            task.stopTask();
          }}
          className="taskButton btn"
        >
          <FontAwesome name="stop" />
        </span>
        <span
          onClick={() => {
            this.editTask(index, task);
          }}
          className="taskButton btn"
        >
          <FontAwesome name="edit" />
        </span>
        <span
          onClick={() => {
            this.props.onAddTask(task.options);
          }}
          className="taskButton btn"
        >
          <FontAwesome name="copy" />
        </span>
        <span
          onClick={() => {
            this.props.taskClasses[index].stopTask();
            this.props.onRemoveTask(this.props.tasks[index]);
            this.props.deleteFromState(index);
          }}
          className="taskButton btn"
        >
          <FontAwesome name="trash" />
        </span>
      </td>
    </tr>
  );

  deleteAllTasks = () => {
    this.props.onRemoveAllTasks();
  };

  render() {
    return (
      <div>
        <CSSTransition in={true} appear={true} timeout={300} classNames="fade">
          <Col className="tableContainer activeContainerInner">
            <Table responsive hover className="text-center">
              <thead>
                <tr>
                  <th>#</th>
                  <th>store</th>
                  <th>profile</th>
                  <th>product</th>
                  <th>timing</th>
                  <th>size</th>
                  <th>color</th>
                  <th>status</th>
                  <th>actions</th>
                </tr>
              </thead>
              <tbody>{this.props.taskClasses.map(this.returnTasks)}</tbody>
            </Table>
            <Container className="taskTableButtonsContainer">
              <Row>
                <Col className="text-center">
                  <Button
                    style={{ width: '100%' }}
                    onClick={() => {
                      this.startAllTasks();
                    }}
                  >
                    start all
                  </Button>
                </Col>
                <Col className="text-center">
                  <Button
                    style={{ width: '100%' }}
                    onClick={() => {
                      ipcRenderer.send(RESET_CAPTCHA_WINDOW, 'reset');
                      this.stopAllTasks();
                    }}
                  >
                    stop all
                  </Button>
                </Col>
                <Col className="text-center">
                  <Button
                    style={{ width: '100%' }}
                    onClick={() => {
                      this.exportTasks();
                    }}
                  >
                    export tasks
                  </Button>
                </Col>
                <Col className="text-center">
                  <Button
                    style={{ width: '100%' }}
                    onClick={() => {
                      this.importTasks();
                    }}
                  >
                    import tasks
                  </Button>
                </Col>
                <Col className="text-center">
                  <Button
                    style={{ width: '100%' }}
                    onClick={() => {
                      this.setState({ deleteAllTasksModal: true });
                    }}
                  >
                    delete all tasks
                  </Button>
                </Col>
              </Row>
            </Container>
          </Col>
        </CSSTransition>
        <Modal id="editTaskModal" size="lg" isOpen={this.state.taskEditModal} toggle={this.toggle} className={this.props.className} centered={true}>
          <ModalBody>
            <Form>
              <FormGroup row>
                <Col xs="3">
                  <Label for="store">store</Label>
                  <Input
                    type="select"
                    name="store"
                    id="store"
                    value={this.state.modalFormData.task.store}
                    onChange={event => {
                      this.handleChange(event);
                    }}
                  >
                    {this.returnSiteOptions(storeDropdown)}
                    {/* {Shops.map(this.returnOptions)} */}
                  </Input>
                </Col>
                {passwordSites.includes(this.state.modalFormData.task.store) ? (
                  <CSSTransition in={true} appear={true} timeout={300} classNames="fade">
                    <Col xs="5">
                      <Label for="email">email</Label>
                      <Input
                        type="text"
                        name="email"
                        id="email"
                        value={this.state.modalFormData.task.email}
                        onChange={event => {
                          this.handleChange(event);
                        }}
                      />
                    </Col>
                  </CSSTransition>
                ) : (
                  ''
                )}
                {passwordSites.includes(this.state.modalFormData.task.store) ? (
                  <CSSTransition in={true} appear={true} timeout={300} classNames="fade">
                    <Col xs="4">
                      <Label for="password">password</Label>
                      <Input
                        type="password"
                        name="password"
                        id="password"
                        value={this.state.modalFormData.task.password}
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
                {this.state.modalFormData.task.store.includes('supreme') ? (
                  ''
                ) : (
                  <Col xs="3">
                    <Label for="mode">mode</Label>
                    <Input
                      type="select"
                      name="mode"
                      id="mode"
                      value={this.state.modalFormData.task.mode}
                      onChange={event => {
                        this.handleChange(event);
                      }}
                    >
                      {this.returnModeOptions(this.state.modalFormData.task.store)}
                    </Input>
                  </Col>
                )}
                {this.state.modalFormData.task.mode !== 'keywords' ? (
                  <Col xs="9">
                    <Label for="modeInput">
                      {this.state.modalFormData.task.mode === 'url'
                        ? 'url'
                        : this.state.modalFormData.task.mode === 'keywords'
                        ? 'keywords'
                        : this.state.modalFormData.task.mode === 'variant'
                        ? 'variant'
                        : this.state.modalFormData.task.mode === 'homepage'
                        ? 'homepage url'
                        : ''}
                    </Label>
                    <Input
                      type="text"
                      name="modeInput"
                      id="modeInput"
                      value={this.state.modalFormData.task.modeInput}
                      placeholder={
                        this.state.modalFormData.task.mode === 'url'
                          ? 'http://example.com'
                          : this.state.modalFormData.task.mode === 'keywords'
                          ? '+yeezy -nike'
                          : this.state.modalFormData.task.mode === 'variant'
                          ? 'variantID'
                          : this.state.modalFormData.task.mode === 'homepage'
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
                {this.state.modalFormData.task.mode === 'homepage' || this.state.modalFormData.task.mode === 'keywords' ? (
                  <CSSTransition in={true} appear={true} timeout={300} classNames="fade">
                    <Col xs="9" style={{ marginTop: this.state.modalFormData.task.mode === 'homepage' ? '1rem' : '' }}>
                      <Label for="keywords">keywords</Label>
                      <Input
                        type="text"
                        name="keywords"
                        id="keywords"
                        value={this.state.modalFormData.task.keywords}
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
                <Col>
                  <Label for="proxy">proxy (optional)</Label>
                  <Input
                    type="text"
                    name="proxy"
                    id="proxy"
                    value={this.state.modalFormData.task.proxy}
                    placeholder="user:pass@0.0.0.0:port or 0.0.0.0:port"
                    onChange={event => {
                      this.handleChange(event);
                    }}
                  />
                </Col>
                <Col>
                  <Label for="monitorDelay">monitor delay (ms)(optional)</Label>
                  <Input
                    type="number"
                    name="monitorDelay"
                    id="monitorDelay"
                    value={this.state.modalFormData.task.monitorDelay}
                    placeholder=""
                    onChange={event => {
                      this.handleChange(event);
                    }}
                  />
                </Col>
                <Col>
                  <Label for="priceCheckVal">price check value (e.g 00.00)</Label>
                  <Input
                    type="number"
                    name="priceCheckVal"
                    id="priceCheckVal"
                    value={this.state.modalFormData.task.priceCheckVal}
                    placeholder=""
                    onChange={event => {
                      this.handleChange(event);
                    }}
                  />
                </Col>
                {this.state.modalFormData.task.store.includes('supreme') ? (
                  <CSSTransition in={true} appear={true} timeout={300} classNames="fade">
                    <Col>
                      <Label for="checkoutDelay">checkout delay (ms)(optional)</Label>
                      <Input
                        type="number"
                        name="checkoutDelay"
                        id="checkoutDelay"
                        value={this.state.modalFormData.task.checkoutDelay}
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
                {this.state.modalFormData.task.mode !== 'variant' ? (
                  <CSSTransition in={true} appear={true} timeout={300} classNames="fade">
                    <Col>
                      <Label for="size">size</Label>
                      <Input
                        type="select"
                        name="size"
                        id="size"
                        value={this.state.modalFormData.task.size}
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
                {this.state.modalFormData.task.mode !== 'variant' && !this.state.modalFormData.task.store.includes('supreme') ? (
                  <CSSTransition in={true} appear={true} timeout={300} classNames="fade">
                    <Col>
                      <Label for="keywordColor">color</Label>
                      <Input
                        type="text"
                        name="keywordColor"
                        id="keywordColor"
                        value={this.state.modalFormData.task.keywordColor}
                        onChange={event => {
                          this.handleChange(event);
                        }}
                      />
                    </Col>
                  </CSSTransition>
                ) : (
                  ''
                )}
                {this.state.modalFormData.task.store.includes('supreme') ? (
                  <CSSTransition in={true} appear={true} timeout={300} classNames="fade">
                    <Col>
                      <Label for="category">category</Label>
                      <Input
                        type="select"
                        name="category"
                        id="category"
                        value={this.state.modalFormData.task.category}
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
                    value={this.state.modalFormData.task.quantity}
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
                          this.state.modalFormData.task.scheduledTime === ''
                            ? moment.unix((Date.now() / 1000) | 0)
                            : moment.unix(this.state.modalFormData.task.scheduledTime)
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
                            modalFormData: {
                              ...this.state.modalFormData,
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
                    value={this.state.modalFormData.task.profile}
                    onChange={event => {
                      this.handleChange(event);
                    }}
                  >
                    {this.profileNames.map(this.returnProfileName)}
                  </Input>
                </Col>
                {this.state.modalFormData.task.store.includes('supreme') ? (
                  <Col xs="3">
                    <Label for="profile">color</Label>
                    <Input
                      type="text"
                      name="color"
                      id="color"
                      value={this.state.modalFormData.task.color}
                      onChange={event => {
                        this.handleChange(event);
                      }}
                    />
                  </Col>
                ) : (
                  ''
                )}
              </FormGroup>
              {/* <FormGroup row style={{ marginTop: '2rem', marginBottom: '2rem' }}>
                    {this.state.modalFormData.store.includes('supreme') ? (
                      <Col xs="3" className="text-center">
                        <Label for="tasks" className="align-items-center" check>
                          ATC Bypass
                          <Input
                            type="checkbox"
                            name="atcBypass"
                            id="atcBypass"
                            style={{ WebkitAppearance: 'checkbox', marginLeft: '15px' }}
                            value={this.state.modalFormData.task.atcBypass}
                            checked={this.state.modalFormData.task.atcBypass === true}
                            onChange={() => {
                              this.setState({
                                modalFormData: {
                                  ...this.state.modalFormData,
                                  atcBypass: !this.state.modalFormData.task.atcBypass
                                }
                              });
                            }}
                          />
                        </Label>
                      </Col>
                    ) : (
                      ''
                    )} */}
              {/* {this.state.modalFormData.task.store.includes('supreme') ? (
                      <Col xs="3" className="text-center">
                        <Label for="tasks" className="align-items-center" check>
                          Captcha Bypass
                          <Input
                            type="checkbox"
                            name="captchaBypass"
                            id="captchaBypass"
                            style={{ WebkitAppearance: 'checkbox', marginLeft: '15px' }}
                            value={this.state.modalFormData.task.captchaBypass}
                            checked={this.state.modalFormData.task.captchaBypass === true}
                            onChange={() => {
                              this.setState({
                                modalFormData: {
                                  ...this.state.modalFormData,
                                  captchaBypass: !this.state.modalFormData.task.captchaBypass
                                }
                              });
                            }}
                          />
                        </Label>
                      </Col>
                    ) : (
                      ''
                    )} */}
              {/* </FormGroup> */}
            </Form>
          </ModalBody>
          <ModalFooter>
            <Button
              onClick={() => {
                this.props.taskClasses[this.state.updateTaskID].stopTask();
                this.handleSaveUpdatedTask(
                  {
                    task: this.state.modalFormData.task,
                    profileID: this.state.modalFormData.profileID
                  },
                  this.state.updateTaskID
                );
                this.toggle();
                this.props.reInitialize();
              }}
            >
              save
            </Button>
            <Button color="danger" onClick={this.toggle}>
              cancel
            </Button>
          </ModalFooter>
        </Modal>
        <Modal size="md" toggle={this.toggleDeleteAllModal} isOpen={this.state.deleteAllTasksModal} centered={true}>
          <ModalBody style={{ paddingTop: '20px' }}>Are you sure you want to delete all of your current tasks?</ModalBody>
          <ModalFooter>
            <Button
              onClick={() => {
                this.setState({ deleteAllTasksModal: false });
                this.deleteAllTasks();
              }}
            >
              yes
            </Button>
            <Button
              onClick={() => {
                this.deleteAllTasks();
              }}
              className="btn-danger"
            >
              cancel
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}
