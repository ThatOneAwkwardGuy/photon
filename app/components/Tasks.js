import React, { Component } from "react";
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Table, Container, Row, Col, Form, FormGroup, Label, Input } from "reactstrap";
import { CSSTransition } from "react-transition-group";
import Task from "../utils/Task";
import FontAwesome from "react-fontawesome";
import ReactSVG from "react-svg";
import stores from "../store/shops";
import Sizes from "../store/sizes";
const _ = require("lodash");
const Shops = _.keys(stores);

export default class Tasks extends Component {
  constructor(props) {
    super(props);
    this.forceUpdateHandler = this.forceUpdateHandler.bind(this);
    this.startAllTasks = this.startAllTasks.bind(this);
    this.returnTasks = this.returnTasks.bind(this);
    this.profileNames = _.keys(this.props.profiles);
    this.taskClasses = [];
    this.taskProxy = this.returnRandomProxy();
    this.state = {
      taskClasses: [],
      taskEditModal: false,
      modalFormData: {
        task: {
          store: Shops[0],
          mode: "url",
          modeInput: "",
          keywords: "",
          proxy: "",
          size: Sizes[0],
          quantity: "1",
          profile: "",
          tasks: "1",
          color: ""
        },
        profileID: ""
      }
    };
  }

  componentDidMount() {
    this.initialize(this.props.tasks);
  }

  componentWillReceiveProps(nextProps) {
    this.initialize(nextProps.tasks);
  }

  forceUpdateHandler() {
    this.forceUpdate();
  }

  returnRandomProxy = () => {
    const proxies = this.props.proxies;
    const randomProxy = proxies[Math.floor(Math.random() * proxies.length)];
    return randomProxy;
  };

  returnOptions = (name, index) => <option key={`shop-${index}`}>{name}</option>;

  handleSaveUpdatedTask(task, id) {
    this.props.onUpdateTask({ task, id });
  }

  initialize = tasksArray => {
    const taskClassesInitialize = [];
    const monitorProxies = this.props.settings.monitorProxies.length > 0 ? this.props.settings.monitorProxies.split(/\r?\n/) : [];
    tasksArray.forEach(element => {
      taskClassesInitialize.push(new Task({ profile: this.props.profiles[element.profileID], ...element }, this.forceUpdateHandler, this.props.settings, this.taskProxy, monitorProxies));
    });
    this.setState({
      taskClasses: taskClassesInitialize
    });
    this.forceUpdate();
  };

  handleChange(e) {
    this.setState({
      modalFormData: {
        ...this.state.modalFormData,
        task: { ...this.state.modalFormData.task, [e.target.name]: e.target.value }
      }
    });
  }

  handleProfileChange(e) {
    this.setState({
      ...this.state,
      modalFormData: {
        ...this.state.modalFormData,
        profileID: e.target.value
      }
    });
  }

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

  startAllTasks() {
    this.state.taskClasses.forEach(element => {
      element.run();
    });
  }

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
      <td>{index}</td>
      <td>{task.options.task.store}</td>
      <td>{task.options.profileID}</td>
      <td>{task.options.task.modeInput === "" ? task.options.task.keywords : task.options.task.modeInput}</td>
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
            this.props.onRemoveTask(this.props.tasks[index]);
            this.setState({
              ...this.state,
              taskClasses: this.state.taskClasses.filter(item => item !== task)
            });
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
                  <th>status</th>
                  <th>actions</th>
                </tr>
              </thead>
              <tbody>{this.state.taskClasses.map(this.returnTasks)}</tbody>
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
                <Col xs="1">
                  <Button>stop all</Button>
                </Col>
              </Row>
            </Container>
          </Col>
        </CSSTransition>
        <Modal isOpen={this.state.taskEditModal} toggle={this.toggle} className={this.props.className} centered={true}>
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
                    {Shops.map(this.returnOptions)}
                  </Input>
                </Col>
              </FormGroup>
              <FormGroup row>
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
                    <option>url</option>
                    <option>keywords</option>
                    <option>variant</option>
                    <option>homepage</option>
                  </Input>
                </Col>
              </FormGroup>
              {this.state.modalFormData.task.mode !== "keywords" ? (
                <FormGroup row>
                  <Col xs="12">
                    <Label for="modeInput">
                      {this.state.modalFormData.task.mode === "url" ? "url" : this.state.modalFormData.task.mode === "keywords" ? "keywords" : this.state.modalFormData.task.mode === "variant" ? "variant" : this.state.modalFormData.task.mode === "homepage" ? "homepage url" : ""}
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
                ""
              )}
              {this.state.modalFormData.task.mode === "homepage" || this.state.modalFormData.task.mode === "keywords" ? (
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
                          this.handleChange(event);
                        }}
                      />
                    </Col>
                  </FormGroup>
                </CSSTransition>
              ) : (
                ""
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
                {this.state.modalFormData.task.mode !== "variant" ? (
                  <CSSTransition in={true} appear={true} timeout={300} classNames="fade">
                    <Col xs="3">
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
                  ""
                )}
                {this.state.modalFormData.task.store === "Supreme" ? (
                  <CSSTransition in={true} appear={true} timeout={300} classNames="fade">
                    <Col xs="3">
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
                  ""
                )}
                <Col xs="3">
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
              </FormGroup>
              <FormGroup row>
                <Col xs="3">
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
                {this.state.modalFormData.task.store === "Supreme" ? (
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
                  ""
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
