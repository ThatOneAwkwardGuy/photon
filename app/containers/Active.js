import React, { Component } from 'react';
import { Container, Row, Col, Modal, ModalBody, ModalFooter } from 'reactstrap';
import { connect } from 'react-redux';
import { addTask, removeTask, updateTask, removeAllTasks } from '../actions/task';
import { addProfile, removeProfile } from '../actions/profile';
import { addProxies } from '../actions/proxy';
import { updateSettings } from '../actions/settings';
import Home from '../components/Home';
import AddTask from '../components/AddTask';
import Tasks from '../components/Tasks';
import Proxies from '../components/Proxies';
import Profiles from '../components/Profiles';
import Settings from '../components/Settings';
import Task from '../utils/Task';

class Active extends Component {
  constructor(props) {
    super(props);
    this.activeComponentCase = this.activeComponentCase.bind(this);
    this.taskProxy = this.returnRandomProxy();
    this.state = {
      taskClasses: []
    };
  }

  forceUpdateHandler = () => {
    this.forceUpdate();
  };

  returnRandomProxy = () => {
    const proxies = this.props.proxies;
    const randomProxy = proxies[Math.floor(Math.random() * proxies.length)];
    return randomProxy;
  };

  reInitialize = () => {
    const tasksArray = this.props.tasks;
    const taskClassesInitialize = [];
    const monitorProxies = this.props.settings.monitorProxies.length > 0 ? this.props.settings.monitorProxies.split(/\r?\n/) : [];
    tasksArray.forEach(element => {
      taskClassesInitialize.push(new Task({ profile: this.props.profiles[element.profileID], ...element }, this.forceUpdateHandler, this.props.settings, this.taskProxy, monitorProxies));
    });
    this.setState({
      taskClasses: taskClassesInitialize.map((task, index) => (this.state.taskClasses[index] !== undefined && this.state.taskClasses[index].active ? this.state.taskClasses[index] : task))
    });
    this.forceUpdate();
  };

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

  deleteFromState = index => {
    this.setState({
      taskClasses: this.state.taskClasses.filter((_, i) => i !== index)
    });
  };

  componentDidMount() {
    this.initialize(this.props.tasks);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const prevPropsJSON = JSON.stringify(prevProps);
    const currPropsJSON = JSON.stringify(this.props);
    if (prevPropsJSON !== currPropsJSON) {
      this.reInitialize();
    }
  }

  activeComponentCase(state) {
    switch (state) {
      case 'Home':
        return <Home />;
      case 'AddTask':
        return <AddTask profiles={this.props.profiles} onAddTask={this.props.onAddTask} />;
      case 'Tasks':
        return (
          <Tasks
            deleteFromState={this.deleteFromState}
            reInitialize={this.reInitialize}
            taskClasses={this.state.taskClasses}
            onAddTask={this.props.onAddTask}
            onRemoveTask={this.props.onRemoveTask}
            onUpdateTask={this.props.onUpdateTask}
            tasks={this.props.tasks}
            profiles={this.props.profiles}
            getCaptchaWindow={this.props.getCaptchaWindow}
            settings={this.props.settings}
            proxies={this.props.proxies}
            onRemoveAllTasks={this.props.onRemoveAllTasks}
          />
        );
      case 'Proxies':
        return <Proxies onAddProxies={this.props.onAddProxies} proxies={this.props.proxies} />;
      case 'Profiles':
        return <Profiles profiles={this.props.profiles} onAddProfile={this.props.onAddProfile} onRemoveProfile={this.props.onRemoveProfile} />;
      case 'Settings':
        return <Settings onUpdateSettings={this.props.onUpdateSettings} settings={this.props.settings} />;
      default:
        return <AddTask />;
    }
  }

  render() {
    return (
      <Col xs="10" className="active">
        <Modal isOpen={this.props.fastModeModalVisible} toggle={this.props.toggleFastModeModal}>
          Tes
        </Modal>
        <Container fluid>
          <Row className="activeContainerOuter">{this.activeComponentCase(this.props.activeWindow)}</Row>
        </Container>
      </Col>
    );
  }
}

const mapStateToProps = state => ({
  tasks: state.taskReducer.tasks,
  profiles: state.profileReducer.profiles,
  proxies: state.proxyReducer.proxies,
  settings: state.settingsReducer
});

const mapActionsToProps = dispatch => ({
  onAddTask: content => {
    dispatch(addTask(content));
  },
  onAddProfile: content => {
    dispatch(addProfile(content));
  },
  onRemoveTask: content => {
    dispatch(removeTask(content));
  },
  onRemoveProfile: content => {
    dispatch(removeProfile(content));
  },
  onAddProxies: content => {
    dispatch(addProxies(content));
  },
  onUpdateTask: content => {
    dispatch(updateTask(content));
  },
  onUpdateSettings: content => {
    dispatch(updateSettings(content));
  },
  onRemoveAllTasks: content => {
    dispatch(removeAllTasks(content));
  }
});

export default connect(
  mapStateToProps,
  mapActionsToProps
)(Active);
