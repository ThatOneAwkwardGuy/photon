import React from 'react';
import { Switch, Route } from 'react-router';

import HomePage from './containers/HomePage';
import Login from './containers/Login';
import Captcha from './containers/Captcha';
import Captchav2 from './containers/Captcha2';
export default (
  <Switch>
    <Route exact path="/" component={Login} />
    <Route exact path="/bot" component={HomePage} />
    <Route exact path="/captcha" component={Captchav2} />
  </Switch>
);
