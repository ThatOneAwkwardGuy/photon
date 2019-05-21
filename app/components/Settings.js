import React, { Component } from 'react';
import { Container, Row, Col, Button, Form, FormGroup, Label, Input, Table } from 'reactstrap';
import { CSSTransition } from 'react-transition-group';
import { auth } from '../api/firebase/index';
import Toggle from 'react-toggle';
import FontAwesome from 'react-fontawesome';
const rp = require('request-promise');
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
        customSites: {},
        googleAccounts: []
      }
    };
  }

  componentDidMount() {
    this.initialize();
  }

  loginToGoogle = async (email, password, cookieJar) => {
    await rp({
      method: 'GET',
      jar: cookieJar,
      uri: 'https://accounts.google.com/ServiceLogin?hl=en&passive=true&continue=https://www.google.com/',
      followRedirect: true,
      resolveWithFullResponse: true
    });

    const emailLookUp = await rp({
      method: 'POST',
      headers: {
        accept: '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'no-cache',
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'google-accounts-xsrf': '1',
        pragma: 'no-cache',
        'x-same-domain': '1',
        referrer:
          'https://accounts.google.com/signin/v2/identifier?hl=en&passive=true&continue=https%3A%2F%2Fwww.google.com%2F&flowName=GlifWebSignIn&flowEntry=ServiceLogin',
        referrerPolicy: 'no-referrer-when-downgrade'
      },
      jar: cookieJar,
      uri: 'https://accounts.google.com/_/signin/sl/lookup?hl=en&_reqid=155835&rt=j',
      followRedirect: true,
      resolveWithFullResponse: true,
      body: `continue=https%3A%2F%2Fwww.google.com%2F&hl=en&f.req=%5B%22${encodeURIComponent(
        email
      )}%22%2C%22AEThLly5pGL2Ki3lmfMGGoS4m_TVeujt1FIJSsmQZomj6YVAOZDM8siVX81Nvq8NPJdvi9H7mzcQBw3JhhT0i-A4xmB1dgbIKZCgeNUVFcgIMQe9fXrKrrAoZgl_qZylmhuaGBmDVS4dw1Z7BrxleZgAzUQpudcSWedKxlF8GaXF5c_AfCNYsxY%22%2C%5B%5D%2Cnull%2C%22GB%22%2Cnull%2Cnull%2C2%2Cfalse%2Ctrue%2C%5Bnull%2Cnull%2C%5B2%2C1%2Cnull%2C1%2C%22https%3A%2F%2Faccounts.google.com%2FServiceLogin%3Fhl%3Den%26passive%3Dtrue%26continue%3Dhttps%253A%252F%252Fwww.google.com%252F%22%2Cnull%2C%5B%5D%2C4%2C%5B%5D%2C%22GlifWebSignIn%22%5D%2C1%2C%5Bnull%2Cnull%2C%5B%5D%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2C%5B%5D%2Cnull%2Cnull%2Cnull%2C%5B%5D%2C%5B%5D%5D%2Cnull%2Cnull%2Cnull%2Ctrue%5D%2C%22${encodeURIComponent(
        email
      )}%22%5D&bgRequest=%5B%22identifier%22%2C%22!R0SlRGVCBNogPZe2FY1EgZLrBMxMIAECAAAAa1IAAAfPmQGWUbDP7zUTeTPaAjL7QIFSGE_U96gbmf8e5A1z7nZ_mXPBuWR55S1cWeBXUdzN81-H-ItOfJPAD1WziVmWEU9PTUwNl_UtsEjvZOosNKDKOJMQXdztncQq65E6BTw2ox0PLNLe4dAN5zZwMWd1IA9ovUC2fxf2guMAqzZak3Jf_3mFcCBt3ZcclO4YU8Tx_Cka7Hbs58250Dhgs9z9RkRQwvv-6VBSZYZkLM0a9PsO-pmbZ_mfNu_ShcAzHRGsSuckwvuX1PSzjISDogms6QQ13XYi36WP8yVNOUM6ZfdUfxA1t-S1IdjWxmywPwf7A7X2S6cqxoNHtWnWp63EY0knKaJcgQK4h55itUYbCkv6tMUFnVCL29fA9axFcra3_twxhDDOHtsi8dZGERbYrkdiYQopMFfCXy1xLAA03ld_Zgf3KDbexs7BBhZGHlbM9NWM95NxuoH_HyisCdjZ_s3ZOUZNLKsvryXnMZggKO2o8_y-rZOZHbptCJHJKSgugj6ggsipdIHo-4Ej5lJoC7W2VncuegJb_w%22%5D&azt=AFoagUVFbwXEzlk823d_NYQiekLDhnxJ9Q%3A1553959770855&cookiesDisabled=false&deviceinfo=%5Bnull%2Cnull%2Cnull%2C%5B%5D%2Cnull%2C%22GB%22%2Cnull%2Cnull%2C%5B%5D%2C%22GlifWebSignIn%22%2Cnull%2C%5Bnull%2Cnull%2C%5B%5D%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2C%5B%5D%2Cnull%2Cnull%2Cnull%2C%5B%5D%2C%5B%5D%5D%5D&gmscoreversion=undefined&checkConnection=youtube%3A195%3A1&checkedDomains=youtube&pstMsg=1&`
    });
    const loginCode = emailLookUp.body.split(`"`)[3];

    const login = await rp({
      method: 'POST',
      uri: 'https://accounts.google.com/_/signin/sl/challenge?hl=en&_reqid=355835&rt=j',
      headers: {
        accept: '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'no-cache',
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'google-accounts-xsrf': '1',
        pragma: 'no-cache',
        'x-same-domain': '1',
        referrer:
          'https://accounts.google.com/signin/v2/sl/pwd?hl=en&passive=true&continue=https%3A%2F%2Fwww.google.com%2F&flowName=GlifWebSignIn&flowEntry=ServiceLogin&cid=1&navigationDirection=forward',
        referrerPolicy: 'no-referrer-when-downgrade'
      },
      jar: cookieJar,
      body: `continue=https%3A%2F%2Fwww.google.com%2F&hl=en&f.req=%5B%22${loginCode}%22%2Cnull%2C1%2Cnull%2C%5B1%2Cnull%2Cnull%2Cnull%2C%5B%22${password}%22%2Cnull%2Ctrue%5D%5D%2C%5Bnull%2Cnull%2C%5B2%2C1%2Cnull%2C1%2C%22https%3A%2F%2Faccounts.google.com%2FServiceLogin%3Fhl%3Den%26passive%3Dtrue%26continue%3Dhttps%253A%252F%252Fwww.google.com%252F%22%2Cnull%2C%5B%5D%2C4%2C%5B%5D%2C%22GlifWebSignIn%22%5D%2C1%2C%5Bnull%2Cnull%2C%5B%5D%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2C%5B%5D%2Cnull%2Cnull%2Cnull%2C%5B%5D%2C%5B%5D%5D%2Cnull%2Cnull%2Cnull%2Ctrue%5D%5D&bgRequest=%5B%22identifier%22%2C%22!w8ClwOFCBNogPZe2FY1EgZLrBMxMIAECAAAAWVIAAAcmmQGgbUb6bBxVY5Nxr9I6EyGloYcdx5m3oG6jc1mKUTsO9iOyJ6FHpDtOYZgvI4EnJmFukL58L5zksuECDWQ5GgdhYCdHwwObtbe-xZuWfNMqzmR6izzfBLzXawDdE26R8kbyj4ogPU5bZWrMHsrED8KzQAb6TVN-CSlJ-etcVJ4mYALrWR21RAKBWl-4MZBilmfWc6s70epG8yvJuCLES4L-FMOSpAia5IrHn5YwnFzroJ54S7TsCg0uvUysPMREfq1P5vYKeqH5yeOXhe-UjcwQa1Hv3yu3UKaBIVNrwYfLdGVu4qO_pBGLK8DqunZfQ6aBnB2EWaw6VLuv21Mrk1RP_M4lazqlJqRZEuvmT_6Otw4Eo0RNF7hwfDexb-7o5ee5dsBMsiCKXX8K4X28RPF3e-mucrt-KosB3cIZrbGKmkbpPcsaPt1hW5_W40H3hTSCM-R7T5O5H9B0a--HSFVODlWtECqUoh47kb3J3lCBKbio6oC75i2QN-b87GdaCiEKo3lNbBCSwXZYKihgTxokAmSPJov4O5vD8LsTW2FrypI%22%5D&bghash=psDJOMEN-Gt-kYnzHttn5GGc8LdDM2TL5qmr7yJNyfM&azt=AFoagUVFbwXEzlk823d_NYQiekLDhnxJ9Q%3A1553959770855&cookiesDisabled=false&deviceinfo=%5Bnull%2Cnull%2Cnull%2C%5B%5D%2Cnull%2C%22GB%22%2Cnull%2Cnull%2C%5B%5D%2C%22GlifWebSignIn%22%2Cnull%2C%5Bnull%2Cnull%2C%5B%5D%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2C%5B%5D%2Cnull%2Cnull%2Cnull%2C%5B%5D%2C%5B%5D%5D%5D&gmscoreversion=undefined&checkConnection=youtube%3A195%3A1&checkedDomains=youtube&pstMsg=1&`,
      followRedirect: true,
      resolveWithFullResponse: true
    });

    if (login.body.includes('INCORRECT_ANSWER_ENTERED')) {
      throw new Error('Wrong Password Entered');
    }

    const get1 = await rp({
      method: 'GET',
      jar: cookieJar,
      uri: `https://accounts.youtube.com/accounts/SetSIDFrame?ssdc=1&sidt=${encodeURIComponent(loginCode)}&pmpo=https%3A%2F%2Faccounts.google.com`,
      followAllRedirects: true,
      resolveWithFullResponse: true,
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'no-cache',
        pragma: 'no-cache',
        'upgrade-insecure-requests': '1',
        referrer:
          'https://accounts.google.com/CheckCookie?hl=en&checkedDomains=youtube&checkConnection=youtube%3A195%3A1&pstMsg=1&chtml=LoginDoneHtml&continue=https%3A%2F%2Fwww.google.com%2F&gidl=EgIIAA',
        referrerPolicy: 'no-referrer-when-downgrade'
      }
    });

    const get2 = await rp({
      method: 'GET',
      jar: cookieJar,
      uri: `https://accounts.google.com/accounts/SetSIDFrame?ssdc=1&sidt=${encodeURIComponent(loginCode)}&pmpo=https%3A%2F%2Faccounts.google.com`,
      followAllRedirects: true,
      resolveWithFullResponse: true,
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'no-cache',
        pragma: 'no-cache',
        'upgrade-insecure-requests': '1',
        referrer:
          'https://accounts.google.com/CheckCookie?hl=en&checkedDomains=youtube&checkConnection=youtube%3A195%3A1&pstMsg=1&chtml=LoginDoneHtml&continue=https%3A%2F%2Fwww.google.com%2F&gidl=EgIIAA',
        referrerPolicy: 'no-referrer-when-downgrade'
      }
    });

    const get3 = await rp({
      method: 'GET',
      followRedirect: true,
      resolveWithFullResponse: true,
      jar: cookieJar,
      uri:
        'https://accounts.google.com/CheckCookie?hl=en&checkedDomains=youtube&checkConnection=youtube%3A195%3A1&pstMsg=1&chtml=LoginDoneHtml&continue=https%3A%2F%2Fwww.google.com%2F&gidl=EgIIAA',
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'no-cache',
        pragma: 'no-cache',
        'upgrade-insecure-requests': '1',
        referrer:
          'https://accounts.google.com/signin/v2/sl/pwd?hl=en&passive=true&continue=https%3A%2F%2Fwww.google.com%2F&flowName=GlifWebSignIn&flowEntry=ServiceLogin&cid=1&navigationDirection=forward',
        referrerPolicy: 'no-referrer-when-downgrade'
      }
    });

    const googleHomepage = await rp({
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'no-cache',
        pragma: 'no-cache',
        'upgrade-insecure-requests': '1',
        referrer:
          'https://accounts.google.com/CheckCookie?hl=en&checkedDomains=youtube&checkConnection=youtube%3A195%3A1&pstMsg=1&chtml=LoginDoneHtml&continue=https%3A%2F%2Fwww.google.com%2F&gidl=EgIIAA',
        referrerPolicy: 'no-referrer-when-downgrade'
      },
      jar: cookieJar,
      uri: 'https://www.google.com/',
      method: 'GET',
      followRedirect: true,
      resolveWithFullResponse: true
    });
  };

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
    const customSite = { name: this.state.settings.customSiteName, url: this.state.settings.customSiteUrl };
    this.props.onAddCustomSite(customSite);
    this.setState({
      settings: {
        ...this.state.settings,
        customSiteName: '',
        customSiteUrl: ''
        // customSites: {
        //   ...this.state.settings.customSites,
        //   [this.state.settings.customSiteName]: this.state.settings.customSiteUrl
        // }
      }
    });
  };

  handleAddGoogleAccount = async () => {
    console.log(this.state.settings.googleAccountEmail, this.state.settings.googleAccountPass);
    try {
      const cookieJar = rp.jar();
      await this.loginToGoogle(this.state.settings.googleAccountEmail, this.state.settings.googleAccountPass, cookieJar);
      console.log(cookieJar);
      const googleAccount = {
        email: this.state.settings.googleAccountEmail,
        password: this.state.settings.googleAccountPass,
        cookies: cookieJar._jar.store.idx
      };
      this.props.onAddGoogleAccount(googleAccount);
      this.setState({
        settings: {
          googleAccountEmail: '',
          googleAccountPass: ''
          // ...this.state.settings,
          // googleAccounts: [...this.state.settings.googleAccounts, googleAccount]
        }
      });
    } catch (error) {
      console.log(error);
    }
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

  returnCustomSites = customSites => {
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
  };

  returnGoogleAccounts = googleAccounts => {
    return Object.values(googleAccounts).map((googleAccount, index) => {
      return (
        <tr key={`Goolge Account - ${index}`}>
          <td>{index + 1}</td>
          <td>{googleAccount.email}</td>
          <td>
            <span
              onClick={() => {
                this.setState(
                  {
                    settings: { ...this.state.settings, googleAccountEmail: googleAccount.email, googleAccountPass: googleAccount.password }
                  },
                  () => {
                    this.handleAddGoogleAccount();
                  }
                );
              }}
              className="taskButton btn"
            >
              <FontAwesome name="retweet" />
            </span>
            <span
              onClick={() => {
                this.props.onRemoveGoogleAccount(googleAccount);
              }}
              className="taskButton btn"
            >
              <FontAwesome name="trash" />
            </span>
          </td>
        </tr>
      );
    });
  };

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
                          <tbody style={{ fontWeight: '300' }}>{this.returnCustomSites(this.props.settings.customSites)}</tbody>
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
                  <FormGroup row>
                    <Col xs="12">
                      <h6 style={{ fontWeight: 600 }}>google accounts</h6>
                      <Container>
                        <Table>
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>email</th>
                              <th>actions</th>
                            </tr>
                          </thead>
                          <tbody style={{ fontWeight: '300' }}>{this.returnGoogleAccounts(this.props.settings.googleAccounts)}</tbody>
                        </Table>
                      </Container>
                      <Container>
                        <Row>
                          <Col xs="5">
                            <Label for="googleAccountEmail">email</Label>
                            <Input
                              type="text"
                              name="googleAccountEmail"
                              id="googleAccountEmail"
                              placeholder="example@gmail.com"
                              value={this.state.settings.googleAccountEmail}
                              onChange={event => {
                                this.handleChange(event);
                              }}
                            />
                          </Col>
                          <Col xs="5">
                            <Label for="googleAccountPass">password</Label>
                            <Input
                              type="password"
                              name="googleAccountPass"
                              id="googleAccountPass"
                              placeholder="password123"
                              value={this.state.settings.googleAccountPass}
                              onChange={event => {
                                this.handleChange(event);
                              }}
                            />
                          </Col>
                          <Col xs="2" className="text-right align-items-end flex-row d-flex justify-content-end">
                            <Button
                              onClick={() => {
                                this.handleAddGoogleAccount();
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
