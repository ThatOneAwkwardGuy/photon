import React from 'react';
import { Route, Switch } from 'react-router';
import HomePage from './containers/HomePage';
import Login from './containers/Login';
import Captcha from './containers/Captcha';
import CaptchaAutofill from './containers/CaptchaAutofill';
import Logs from './containers/Logs';
export default (
  <Switch>
    <Route exact path="/" component={Login} />
    <Route path="/bot" component={HomePage} />
    <Route path="/captcha" component={Captcha} />
    <Route path="/logs" component={Logs} />
    <Route path="/captchaAutofill" component={CaptchaAutofill} />
  </Switch>
);
