// @flow
import React, { Component } from "react";
import { Container, Row, Col, Button } from "reactstrap";
import ReactSVG from "react-svg";
import { auth } from "../api/firebase/";

export default class CaptchaFooter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userEmail: "Not Available"
    };
  }

  componentDidMount() {
    auth.authorise.onAuthStateChanged(user => {
      if (user) {
        this.setState({
          userEmail: user.email
        });
      }
    });
  }

  render() {
    return (
      <Row className="captchaFooter">
        <Col xs="6" className="text-center footerRightSection">
          <Button
            onClick={() => {
              this.props.clearCookies();
            }}
          >
            Delete Cookies
          </Button>
        </Col>
        <Col xs="6" className="text-left footerLeftSection">
          <Button
            onClick={() => {
              this.props.goToGoogleLogin();
            }}
          >
            Google Login
          </Button>
        </Col>
      </Row>
    );
  }
}
