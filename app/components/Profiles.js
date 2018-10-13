import React, { Component } from 'react';
import { Row, Col, Button, Form, FormGroup, Label, Input } from 'reactstrap';
import { omit } from 'lodash';
import Countries from '../store/countries';
import { CSSTransition } from 'react-transition-group';
const _ = require('lodash');
var fs = require('fs');
const { dialog } = require('electron').remote;

export default class Profiles extends Component {
  constructor(props) {
    super(props);
    this.countryNames = _.keys(Countries);
    this.regions = [];
    this.state = {
      formdata: {
        profileID: '',
        deliveryCountry: '',
        deliveryAddress: '',
        deliveryCity: '',
        deliveryFirstName: '',
        deliveryLastName: '',
        deliveryProvince: '',
        deliveryZip: '',
        deliveryAptorSuite: '',
        billingZip: '',
        billingCountry: '',
        billingAddress: '',
        billingCity: '',
        billingFirstName: '',
        billingLastName: '',
        billingProvince: '',
        billingAptorSuite: '',
        phoneNumber: '',
        paymentEmail: '',
        paymentCardholdersName: '',
        paymentCardnumber: '',
        paymentCardExpiryMonth: '',
        paymentCardExpiryYear: '',
        paymentCVV: ''
      },
      regionArrayShipping: [],
      regionArrayBilling: [],
      profileNames: _.keys(this.props.profiles),
      profileIDLoad: _.keys(this.props.profiles)[0]
    };
  }

  handleChangeShippingOrBilling = e => {
    this.setState({
      formdata: Object.assign({}, this.state.formdata, {
        [e.target.name]: e.target.value
      })
    });
  };

  handleProfileChange = e => {
    this.setState({
      profileIDLoad: e.target.value
    });
  };

  returnCountry = (name, index) => <option key={`country-${index}`}>{name}</option>;

  returnProfileName = (name, index) => <option key={`profile-${index}`}>{name}</option>;

  loadProfile = () => {
    this.setState({
      formdata: this.props.profiles[this.state.profileIDLoad],
      regionArrayBilling: Countries[this.props.profiles[this.state.profileIDLoad].billingCountry].provinces,
      regionArrayShipping: Countries[this.props.profiles[this.state.profileIDLoad].deliveryCountry].provinces
    });
  };

  deleteProfile = () => {
    this.props.onRemoveProfile(this.state.profileIDLoad);
    this.setState({
      profiles: omit(this.state.profiles, this.state.profileIDLoad)
    });
  };

  setDeliveryToBilling = () => {
    this.setState({
      formdata: Object.assign({}, this.state.formdata, {
        billingCountry: this.state.formdata.deliveryCountry,
        billingAddress: this.state.formdata.deliveryAddress,
        billingCity: this.state.formdata.deliveryCity,
        billingFirstName: this.state.formdata.deliveryFirstName,
        billingLastName: this.state.formdata.deliveryLastName,
        billingProvince: this.state.formdata.deliveryProvince,
        billingZip: this.state.formdata.deliveryZip,
        billingAptorSuite: this.state.formdata.deliveryAptorSuite
      })
    });
  };

  toggleSameDeliveryBilling = () => {
    this.setState({
      sameDeliveryBilling: !this.state.sameDeliveryBilling
    });
  };

  setRegionArrayShipping = countryName => {
    this.setState({
      regionArrayShipping: Countries[countryName].provinces
    });
    if (Countries[countryName].provinces !== null) {
      this.setState(prevState => ({
        formdata: {
          ...prevState.formdata,
          deliveryProvince: Countries[countryName].provinces[0]
        }
      }));
    } else {
      this.setState(prevState => ({
        formdata: {
          ...prevState.formdata,
          deliveryProvince: ''
        }
      }));
    }
  };

  setRegionArrayBilling = countryName => {
    this.setState({
      regionArrayBilling: Countries[countryName].provinces
    });
    if (Countries[countryName].provinces !== null) {
      this.setState(prevState => ({
        formdata: {
          ...prevState.formdata,
          billingProvince: Countries[countryName].provinces[0]
        }
      }));
    } else {
      this.setState(prevState => ({
        formdata: {
          ...prevState.formdata,
          billingProvince: ''
        }
      }));
    }
  };

  componentWillReceiveProps(nextProps) {
    this.setState({
      formdata: {
        profileID: '',
        deliveryCountry: '',
        deliveryAddress: '',
        deliveryCity: '',
        deliveryFirstName: '',
        deliveryLastName: '',
        deliveryProvince: '',
        deliveryZip: '',
        deliveryAptorSuite: '',
        billingZip: '',
        billingCountry: '',
        billingAddress: '',
        billingCity: '',
        billingFirstName: '',
        billingLastName: '',
        billingProvince: '',
        billingAptorSuite: '',
        phoneNumber: '',
        paymentEmail: '',
        paymentCardholdersName: '',
        paymentCardnumber: '',
        paymentCardExpiryMonth: '',
        paymentCardExpiryYear: '',
        paymentCVV: ''
      },
      regionArrayShipping: [],
      regionArrayBilling: [],
      profileNames: _.keys(nextProps.profiles),
      profileIDLoad: _.keys(nextProps.profiles)[0]
    });
  }

  handleSubmit = () => {
    const profile = this.state.formdata;
    this.props.onAddProfile(profile);
  };

  exportProfiles = () => {
    const JSONTask = JSON.stringify(this.props.profiles);
    dialog.showSaveDialog(
      {
        title: 'photon_profiles',
        defaultPath: '~/photon_profiles.json',
        filters: [{ name: 'Photon Files', extensions: ['json'] }]
      },
      fileName => {
        if (fileName === undefined) {
          return;
        }
        fs.writeFile(fileName, JSONTask, err => {
          if (err) {
            this.setState({
              profileExportFailure: true
            });
            return;
          }
          this.setState({
            profileExportSuccess: true
          });
        });
      }
    );
  };

  importProfiles = () => {
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
              profileImportFailure: true
            });
            return;
          }
          const profileOBJ = JSON.parse(data);
          for (const profile in profileOBJ) {
            this.props.onAddProfile(profileOBJ[profile]);
          }
        });
      }
    );
  };

  render() {
    return (
      <CSSTransition in={true} appear={true} timeout={300} classNames="fade">
        <Col>
          <Row className="activeContainerInner">
            <Col xs="6">
              <h6>save profile</h6>
              <Form>
                <FormGroup row>
                  <Col xs="9">
                    <Input
                      type="text"
                      name="profileID"
                      id="profileID"
                      value={this.state.formdata.profileID}
                      onChange={event => {
                        this.handleChangeShippingOrBilling(event);
                      }}
                    />
                  </Col>
                  <Col xs="3">
                    <Button
                      onClick={() => {
                        this.handleSubmit();
                      }}
                      className="primaryButton"
                    >
                      save
                    </Button>
                  </Col>
                </FormGroup>
              </Form>
            </Col>
            <Col xs="6">
              <h6>load profile</h6>
              <Form>
                <FormGroup row>
                  <Col xs="7">
                    <Input
                      type="select"
                      name="profileIDLoad"
                      id="profileIDLoad"
                      value={this.state.profileIDLoad}
                      onChange={event => {
                        this.handleProfileChange(event);
                      }}
                    >
                      {this.state.profileNames.map(this.returnProfileName)}
                    </Input>
                  </Col>
                  <Col xs="2">
                    <Button
                      onClick={() => {
                        this.loadProfile();
                      }}
                      className="primaryButton"
                    >
                      load
                    </Button>
                  </Col>
                  <Col xs="2">
                    <Button
                      onClick={() => {
                        this.deleteProfile();
                      }}
                      color="danger"
                    >
                      delete
                    </Button>
                  </Col>
                </FormGroup>
                <FormGroup row>
                  <Col xs="6">
                    <Button
                      onClick={() => {
                        this.importProfiles();
                      }}
                      className="primaryButton"
                    >
                      import profiles
                    </Button>
                  </Col>
                  <Col xs="6">
                    <Button
                      onClick={() => {
                        this.exportProfiles();
                      }}
                      className="primaryButton"
                    >
                      export profiles
                    </Button>
                  </Col>
                </FormGroup>
              </Form>
            </Col>
          </Row>

          <Row className="activeContainerInner">
            <Col xs="6">
              <h6>delivery address</h6>
              <Form>
                <FormGroup row>
                  <Col xs="6">
                    <Label for="store">first name</Label>
                    <Input
                      type="text"
                      name="deliveryFirstName"
                      id="deliveryFirstName"
                      value={this.state.formdata.deliveryFirstName}
                      onChange={event => {
                        this.handleChangeShippingOrBilling(event);
                      }}
                    />
                  </Col>
                  <Col xs="6">
                    <Label for="store">last name</Label>
                    <Input
                      type="text"
                      name="deliveryLastName"
                      id="deliveryLastName"
                      value={this.state.formdata.deliveryLastName}
                      onChange={event => {
                        this.handleChangeShippingOrBilling(event);
                      }}
                    />
                  </Col>
                </FormGroup>
                <FormGroup row>
                  <Col xs="9">
                    <Label for="store">address</Label>
                    <Input
                      type="text"
                      name="deliveryAddress"
                      id="deliveryAddress"
                      value={this.state.formdata.deliveryAddress}
                      onChange={event => {
                        this.handleChangeShippingOrBilling(event);
                      }}
                    />
                  </Col>
                  <Col xs="3">
                    <Label for="store">apt,suite</Label>
                    <Input
                      type="text"
                      name="deliveryAptorSuite"
                      id="deliveryAptorSuite"
                      value={this.state.formdata.deliveryAptorSuite}
                      onChange={event => {
                        this.handleChangeShippingOrBilling(event);
                      }}
                    />
                  </Col>
                </FormGroup>
                <FormGroup row>
                  <Col xs="12">
                    <Label for="store">city</Label>
                    <Input
                      type="text"
                      name="deliveryCity"
                      id="deliveryCity"
                      value={this.state.formdata.deliveryCity}
                      onChange={event => {
                        this.handleChangeShippingOrBilling(event);
                      }}
                    />
                  </Col>
                </FormGroup>
                <FormGroup row>
                  <Col xs="4">
                    <Label for="store">country</Label>
                    <Input
                      type="select"
                      name="deliveryCountry"
                      id="deliveryCountry"
                      value={this.state.formdata.deliveryCountry}
                      onChange={event => {
                        this.handleChangeShippingOrBilling(event);
                        this.setRegionArrayShipping(event.target.value);
                      }}
                    >
                      <option value="" />
                      {this.countryNames.map(this.returnCountry)}
                    </Input>
                  </Col>
                  <Col xs="4">
                    <Label for="store">region</Label>
                    <Input
                      type="select"
                      name="deliveryProvince"
                      id="deliveryProvince"
                      value={this.state.formdata.deliveryProvince}
                      onChange={event => {
                        this.handleChangeShippingOrBilling(event);
                      }}
                    >
                      {/* {this.state.regionArrayShipping !== null && this.state.regionArrayShipping !== [] ? (
                        this.state.formdata.deliveryProvince !== null && this.state.formdata.deliveryProvince !== '' ? (
                          <option key="country-load">{this.state.formdata.deliveryProvince}</option>
                        ) : (
                          this.state.regionArrayShipping.map(this.returnCountry)
                        )
                      ) : null} */}
                      {this.state.regionArrayShipping !== null ? this.state.regionArrayShipping.map(this.returnCountry) : null}
                    </Input>
                  </Col>
                  <Col xs="4">
                    <Label for="store">zip code</Label>
                    <Input
                      type="text"
                      name="deliveryZip"
                      id="deliveryZip"
                      value={this.state.formdata.deliveryZip}
                      onChange={event => {
                        this.handleChangeShippingOrBilling(event);
                      }}
                    />
                  </Col>
                </FormGroup>
              </Form>
            </Col>
            <Col xs="6">
              <h6>billing address</h6>
              <Form>
                <FormGroup row>
                  <Col xs="6">
                    <Label for="store">first name</Label>
                    <Input
                      type="text"
                      name="billingFirstName"
                      id="billingFirstName"
                      value={this.state.formdata.billingFirstName}
                      onChange={event => {
                        this.handleChangeShippingOrBilling(event);
                      }}
                    />
                  </Col>
                  <Col xs="6">
                    <Label for="store">last name</Label>
                    <Input
                      type="text"
                      name="billingLastName"
                      id="billingLastName"
                      value={this.state.formdata.billingLastName}
                      onChange={event => {
                        this.handleChangeShippingOrBilling(event);
                      }}
                    />
                  </Col>
                </FormGroup>
                <FormGroup row>
                  <Col xs="9">
                    <Label for="store">address</Label>
                    <Input
                      type="text"
                      name="billingAddress"
                      id="billingAddress"
                      value={this.state.formdata.billingAddress}
                      onChange={event => {
                        this.handleChangeShippingOrBilling(event);
                      }}
                    />
                  </Col>
                  <Col xs="3">
                    <Label for="store">apt,suite</Label>
                    <Input
                      type="text"
                      name="billingAptorSuite"
                      id="billingAptorSuite"
                      value={this.state.formdata.billingAptorSuite}
                      onChange={event => {
                        this.handleChangeShippingOrBilling(event);
                      }}
                    />
                  </Col>
                </FormGroup>
                <FormGroup row>
                  <Col xs="12">
                    <Label for="store">city</Label>
                    <Input
                      type="text"
                      name="billingCity"
                      id="billingCity"
                      value={this.state.formdata.billingCity}
                      onChange={event => {
                        this.handleChangeShippingOrBilling(event);
                      }}
                    />
                  </Col>
                </FormGroup>
                <FormGroup row>
                  <Col xs="4">
                    <Label for="store">country</Label>
                    <Input
                      type="select"
                      name="billingCountry"
                      id="billingCountry"
                      value={this.state.formdata.billingCountry}
                      onChange={event => {
                        this.handleChangeShippingOrBilling(event);
                        this.setRegionArrayBilling(event.target.value);
                      }}
                    >
                      <option value="" />
                      {this.countryNames.map(this.returnCountry)}
                    </Input>
                  </Col>
                  <Col xs="4">
                    <Label for="store">region</Label>
                    <Input
                      type="select"
                      name="billingProvince"
                      id="billingProvince"
                      value={this.state.formdata.billingProvince}
                      onChange={event => {
                        this.handleChangeShippingOrBilling(event);
                      }}
                    >
                      {this.state.regionArrayBilling !== null ? this.state.regionArrayBilling.map(this.returnCountry) : null}
                    </Input>
                  </Col>
                  <Col xs="4">
                    <Label for="store">zip code</Label>
                    <Input
                      type="text"
                      name="billingZip"
                      id="billingZip"
                      value={this.state.formdata.billingZip}
                      onChange={event => {
                        this.handleChangeShippingOrBilling(event);
                      }}
                    />
                  </Col>
                </FormGroup>
                <FormGroup row>
                  <Col xs="12">
                    <Label for="store">
                      <Button
                        onClick={() => {
                          this.toggleSameDeliveryBilling();
                          this.setDeliveryToBilling();
                        }}
                      >
                        Copy Delivery
                      </Button>
                      {/* <Input
                      type="checkbox"
                      name="sameDeliveryBilling"
                      id="sameDeliveryBilling"
                      onChange={}
                    /> */}
                    </Label>
                  </Col>
                </FormGroup>
              </Form>
            </Col>
          </Row>
          <Row className="activeContainerInner">
            <Col xs="8">
              <h6>payment</h6>
              <Form>
                <FormGroup row>
                  <Col xs="12">
                    <Label for="store">email</Label>
                    <Input
                      type="text"
                      name="paymentEmail"
                      id="paymentEmail"
                      value={this.state.formdata.paymentEmail}
                      onChange={event => {
                        this.handleChangeShippingOrBilling(event);
                      }}
                    />
                  </Col>
                </FormGroup>
                <FormGroup row>
                  <Col xs="12">
                    <Label for="store">phone number</Label>
                    <Input
                      type="text"
                      name="phoneNumber"
                      id="phoneNumber"
                      value={this.state.formdata.phoneNumber}
                      onChange={event => {
                        this.handleChangeShippingOrBilling(event);
                      }}
                    />
                  </Col>
                </FormGroup>
                <FormGroup row>
                  <Col xs="12">
                    <Label for="paymentCardholdersName">cardholder name</Label>
                    <Input
                      type="text"
                      name="paymentCardholdersName"
                      id="paymentCardholdersName"
                      value={this.state.formdata.paymentCardholdersName}
                      onChange={event => {
                        this.handleChangeShippingOrBilling(event);
                      }}
                    />
                  </Col>
                </FormGroup>
                <FormGroup row>
                  <Col xs="5">
                    <Label for="paymentCardnumber">card number</Label>
                    <Input
                      type="text"
                      name="paymentCardnumber"
                      id="paymentCardnumber"
                      value={this.state.formdata.paymentCardnumber}
                      onChange={event => {
                        this.handleChangeShippingOrBilling(event);
                      }}
                    />
                  </Col>
                  <Col xs="2">
                    <Label for="paymentCardExpiry">mm</Label>
                    <Input
                      type="text"
                      name="paymentCardExpiryMonth"
                      id="paymentCardExpiryMonth"
                      value={this.state.formdata.paymentCardExpiryMonth}
                      onChange={event => {
                        this.handleChangeShippingOrBilling(event);
                      }}
                    />
                  </Col>
                  <Col xs="3">
                    <Label for="paymentCardExpiry">yyyy</Label>
                    <Input
                      type="text"
                      name="paymentCardExpiryYear"
                      id="paymentCardExpiryYear"
                      value={this.state.formdata.paymentCardExpiryYear}
                      onChange={event => {
                        this.handleChangeShippingOrBilling(event);
                      }}
                    />
                  </Col>
                  <Col xs="2">
                    <Label for="paymentCVV">cvv</Label>
                    <Input
                      type="text"
                      name="paymentCVV"
                      id="paymentCVV"
                      value={this.state.formdata.paymentCVV}
                      onChange={event => {
                        this.handleChangeShippingOrBilling(event);
                      }}
                    />
                  </Col>
                </FormGroup>
              </Form>
            </Col>
          </Row>
        </Col>
      </CSSTransition>
    );
  }
}
