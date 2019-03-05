import React from 'react';
import { Route, Switch } from 'react-router';
import HomePage from './containers/HomePage';
import Login from './containers/Login';
import Captcha from './containers/Captcha';
import Logs from './containers/Logs';
export default (
  <Switch>
    <Route exact path="/" component={Login} />
    <Route exact path="/bot" component={HomePage} />
    <Route exact path="/captcha" component={Captcha} />
    <Route exact path="/logs" component={Logs} />
  </Switch>
);
