import React, { Component } from 'react';
import { Button, Modal, ModalBody, ModalFooter, Table, Container, Row, Col, Form, FormGroup, Label, Input } from 'reactstrap';
import { CSSTransition } from 'react-transition-group';
import Task from '../utils/Task';
import FontAwesome from 'react-fontawesome';
import stores from '../store/shops';
import Sizes from '../store/sizes';
import { ipcRenderer } from 'electron';
import { RESET_CAPTCHA_TOKENS_ARRAY, RESET_CAPTCHA_WINDOW } from '../utils/constants';
import Datetime from 'react-datetime';
var fs = require('fs');
var moment = require('moment');
const _ = require('lodash');
const Shops = _.keys(stores);
const { dialog } = require('electron').remote;

export default class Tasks extends Component {
  constructor(props) {
    super(props);
    this.profileNames = _.keys(this.props.profiles);
    this.taskClasses = this.props.taskClasses;
    this.state = {
      taskEditModal: false,
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
          scheduledTime: ''
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

  returnOptions = (name, index) => <option key={`shop-${index}`}>{name}</option>;

  handleSaveUpdatedTask = (task, id) => {
    this.props.onUpdateTask({ task, id });
  };

  handleChange = e => {
    this.setState({
      modalFormData: {
        ...this.state.modalFormData,
        task: { ...this.state.modalFormData.task, [e.target.name]: e.target.value }
      }
    });
  };

  setScheduledTime = date => {
    this.setState({
      modalFormData: {
        ...this.state.modalFormData,
        task: { ...this.state.modalFormData.task, scheduledTime: date }
      }
    });
  };

  handleProfileChange = e => {
    this.setState({
      ...this.state,
      modalFormData: {
        ...this.state.modalFormData,
        profileID: e.target.value
      }
    });
  };

  editTask = (index, task) => {
    this.setState({
      ...this.state,
      taskEditModal: true,
      modalFormData: { task: task.options.task, profileID: task.options.profileID },
      updateTaskID: index
    });
  };

  returnProfileName = (name, index) => <option key={`profile-${index}`}>{name}</option>;

  toggle = () => {
    this.setState({
      ...this.state,
      taskEditModal: !this.state.taskEditModal
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
      element.stop();
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

  returnTasks = (task, index) => (
    <tr key={`task-${index}`}>
      <td>{index + 1}</td>
      <td>{task.options.task.store}</td>
      <td>{task.options.profileID}</td>
      <td>{task.options.task.modeInput === '' ? task.options.task.keywords : task.options.task.modeInput}</td>
      <td>{task.options.task.scheduledTime === '' || task.options.task.scheduledTime === undefined ? 'manual' : moment.unix(task.options.task.scheduledTime).format('HH:mm A dddd, MMMM Do YYYY')}</td>
      <td>{task.options.task.size}</td>
      <td>{task.status}</td>
      <td>
        <Button
          onClick={() => {
            task.run();
          }}
          className="taskButton"
        >
          <FontAwesome name="play" />
        </Button>
        <Button
          onClick={() => {
            ipcRenderer.send(RESET_CAPTCHA_WINDOW, 'reset');
            task.stop();
          }}
          className="taskButton"
        >
          <FontAwesome name="stop" />
        </Button>
        <Button
          onClick={() => {
            this.editTask(index, task);
          }}
          className="taskButton"
        >
          <FontAwesome name="edit" />
        </Button>
        <Button
          onClick={() => {
            this.props.taskClasses[index].stop();
            this.props.onRemoveTask(this.props.tasks[index]);
            this.props.deleteFromState(index);
          }}
          className="taskButton"
        >
          <FontAwesome name="trash" />
        </Button>
      </td>
    </tr>
  );

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
                  <th>status</th>
                  <th>actions</th>
                </tr>
              </thead>
              <tbody>{this.props.taskClasses.map(this.returnTasks)}</tbody>
            </Table>
            <Container className="taskTableButtonsContainer">
              <Row>
                <Col xs="2">
                  <Button
                    onClick={() => {
                      this.startAllTasks();
                    }}
                  >
                    start all
                  </Button>
                </Col>
                <Col xs="2">
                  <Button
                    onClick={() => {
                      ipcRenderer.send(RESET_CAPTCHA_WINDOW, 'reset');
                      this.stopAllTasks();
                    }}
                  >
                    stop all
                  </Button>
                </Col>
                <Col xs="2">
                  <Button
                    onClick={() => {
                      this.exportTasks();
                    }}
                  >
                    export tasks
                  </Button>
                </Col>
                <Col xs="2">
                  <Button
                    onClick={() => {
                      this.importTasks();
                    }}
                  >
                    import tasks
                  </Button>
                </Col>
              </Row>
            </Container>
          </Col>
        </CSSTransition>
        <Modal size="lg" isOpen={this.state.taskEditModal} toggle={this.toggle} className={this.props.className} centered={true}>
          <ModalBody>
            <Form>
              <FormGroup row>
                <Col xs="6">
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
                    {Shops.map(this.returnOptions)}
                  </Input>
                </Col>
              </FormGroup>
              <FormGroup row>
                <Col xs="6">
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
                    <option>url</option>
                    <option>keywords</option>
                    <option>variant</option>
                    <option>homepage</option>
                  </Input>
                </Col>
              </FormGroup>
              {this.state.modalFormData.task.mode !== 'keywords' ? (
                <FormGroup row>
                  <Col xs="12">
                    <Label for="modeInput">
                      {this.state.modalFormData.task.mode === 'url' ? 'url' : this.state.modalFormData.task.mode === 'keywords' ? 'keywords' : this.state.modalFormData.task.mode === 'variant' ? 'variant' : this.state.modalFormData.task.mode === 'homepage' ? 'homepage url' : ''}
                    </Label>
                    <Input
                      type="text"
                      name="modeInput"
                      id="modeInput"
                      value={this.state.modalFormData.task.modeInput}
                      placeholder="e.g +yeezy or http://example.com or variantID"
                      onChange={event => {
                        this.handleChange(event);
                      }}
                    />
                  </Col>
                </FormGroup>
              ) : (
                ''
              )}
              {this.state.modalFormData.task.mode === 'homepage' || this.state.modalFormData.task.mode === 'keywords' ? (
                <CSSTransition in={true} appear={true} timeout={300} classNames="fade">
                  <FormGroup row>
                    <Col xs="12">
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
                  </FormGroup>
                </CSSTransition>
              ) : (
                ''
              )}
              <FormGroup row>
                <Col xs="12">
                  <Label for="proxy">proxy (optional)</Label>
                  <Input
                    type="text"
                    name="proxy"
                    id="proxy"
                    value={this.state.modalFormData.task.proxy}
                    placeholder="user:pass@0.0.0.0:port"
                    onChange={event => {
                      this.handleChange(event);
                    }}
                  />
                </Col>
              </FormGroup>
              <FormGroup row>
                {this.state.modalFormData.task.mode !== 'variant' ? (
                  <CSSTransition in={true} appear={true} timeout={300} classNames="fade">
                    <Col xs="6">
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
                {this.state.modalFormData.task.store === 'Supreme' ? (
                  <CSSTransition in={true} appear={true} timeout={300} classNames="fade">
                    <Col xs="6">
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
                        <option>Tops/Sweaters</option>
                        <option>new</option>
                      </Input>
                    </Col>
                  </CSSTransition>
                ) : (
                  ''
                )}
                <Col xs="6">
                  <Label for="quantity">quantity</Label>
                  <Input
                    type="select"
                    name="select"
                    id="select"
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
                <Col xs="6">
                  <Label for="scheduledTime">Schedule Time</Label>
                  <Datetime
                    // value={moment.unix(this.state.modalFormData.task.scheduledTime).format('HH:mm A dddd, MMMM Do YYYY')}
                    value={this.state.modalFormData.task.scheduledTime === '' ? moment.unix((Date.now() / 1000) | 0) : moment.unix(this.state.modalFormData.task.scheduledTime)}
                    // value={this.state.modalFormData.task.scheduledTime}
                    dateFormat="dddd, MMMM Do YYYY"
                    timeFormat="HH:mm A"
                    isValidDate={(currentDate, selectedDate) => {
                      if (currentDate >= Date.now() - 24 * 60 * 60 * 1000) {
                        return true;
                      }
                    }}
                    onChange={date => {
                      this.setScheduledTime(date.unix());
                    }}
                  />
                </Col>
              </FormGroup>
              <FormGroup row>
                <Col xs="6">
                  <Label for="profile">profile</Label>
                  <Input
                    type="select"
                    name="profileID"
                    id="profileID"
                    value={this.state.modalFormData.profileID}
                    onChange={event => {
                      this.handleProfileChange(event);
                    }}
                  >
                    {this.profileNames.map(this.returnProfileName)}
                  </Input>
                </Col>
                {this.state.modalFormData.task.store === 'Supreme' ? (
                  <Col xs="6">
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
            </Form>
          </ModalBody>
          <ModalFooter>
            <Button
              onClick={() => {
                this.handleSaveUpdatedTask(
                  {
                    task: this.state.modalFormData.task,
                    profileID: this.state.modalFormData.profileID
                  },
                  this.state.updateTaskID
                );
                this.toggle();
              }}
            >
              save
            </Button>
            <Button color="danger" onClick={this.toggle}>
              cancel
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}
