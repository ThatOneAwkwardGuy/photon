import React, { Component } from 'react';
import { ListGroup, ListGroupItem, Container, Row, Col } from 'reactstrap';
import FontAwesome from 'react-fontawesome';
import { auth } from '../api/firebase/';
const ipcRenderer = require('electron').ipcRenderer;
import { OPEN_CAPTCHA_WINDOW } from '../utils/constants';
export default class Sidebar extends Component {
  constructor(props) {
    super(props);
    this.checkAccountSidebar = this.checkAccountSidebar.bind(this);
  }

  checkAccountSidebar() {
    auth.authorise.onAuthStateChanged(user => {
      if (!user) {
        this.props.history.push('/');
      }
    });
  }

  openCaptchaWindow = () => {
    ipcRenderer.send(OPEN_CAPTCHA_WINDOW, 'open');
  };

  render() {
    return (
      <Col className="sidebar" xs="2">
        <ListGroup>
          <ListGroupItem
            onClick={() => {
              this.checkAccountSidebar();
              this.props.switchActiveComponent('Home');
            }}
            active={this.props.activeWindow === 'Home' ? true : undefined}
            tag="button"
            action
          >
            <FontAwesome name="home" className="sidebarIcon" />
            home
          </ListGroupItem>
          <ListGroupItem
            onClick={() => {
              this.checkAccountSidebar();
              this.props.switchActiveComponent('Tasks');
            }}
            active={this.props.activeWindow === 'Tasks' ? true : undefined}
            tag="button"
            action
          >
            <FontAwesome name="tasks" className="sidebarIcon" />
            tasks
          </ListGroupItem>
          <ListGroupItem
            onClick={() => {
              this.checkAccountSidebar();
              this.props.switchActiveComponent('AddTask');
            }}
            active={this.props.activeWindow === 'AddTask' ? true : undefined}
            tag="button"
            action
          >
            <FontAwesome name="plus" className="sidebarIcon" />
            add task
          </ListGroupItem>
          <ListGroupItem
            onClick={() => {
              this.checkAccountSidebar();
              this.props.switchActiveComponent('Proxies');
            }}
            active={this.props.activeWindow === 'Proxies' ? true : undefined}
            tag="button"
            action
          >
            <FontAwesome name="database" className="sidebarIcon" />
            proxies
          </ListGroupItem>
          <ListGroupItem
            onClick={() => {
              this.checkAccountSidebar();
              this.props.switchActiveComponent('Profiles');
            }}
            active={this.props.activeWindow === 'Profiles' ? true : undefined}
            tag="button"
            action
          >
            <FontAwesome name="users" className="sidebarIcon" />
            profiles
          </ListGroupItem>
          <ListGroupItem
            onClick={() => {
              this.checkAccountSidebar();
              this.props.switchActiveComponent('Settings');
            }}
            active={this.props.activeWindow === 'Settings' ? true : undefined}
            tag="button"
            action
          >
            <FontAwesome name="cog" className="sidebarIcon" />
            settings
          </ListGroupItem>
        </ListGroup>
        <div className="sideBarBottom">
          <ListGroup>
            {/* <ListGroupItem
              onClick={() => {
                this.props.toggleFastModeModal();
              }}
              tag="button"
              action
            >
              <FontAwesome name="bolt" className="sidebarIcon" />
              fast mode
            </ListGroupItem> */}
            <ListGroupItem
              onClick={() => {
                this.openCaptchaWindow();
              }}
              tag="button"
              action
            >
              <FontAwesome name="code" className="sidebarIcon" />
              captcha
            </ListGroupItem>
          </ListGroup>
        </div>
      </Col>
    );
  }
}
