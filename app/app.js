import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';
import { createMemoryHistory } from 'history';
import routes from './routes';
import configureStore from './store';
import '../node_modules/font-awesome/css/font-awesome.css';
import '../node_modules/bootstrap/dist/css/bootstrap.css';
import './fonts/stylesheet.css';
import './app.global.css';
import './react-datetime.css';

const syncHistoryWithStore = (store, history) => {
  const { routing } = store.getState();
  if (routing && routing.location) {
    history.replace(routing.location);
  }
};

const initialState = {};
const routerHistory = createMemoryHistory();
const store = configureStore(initialState, routerHistory);
syncHistoryWithStore(store, routerHistory);

const rootElement = document.querySelector(document.currentScript.getAttribute('data-container'));

ReactDOM.render(
  <Provider store={store}>
    <ConnectedRouter history={routerHistory}>{routes}</ConnectedRouter>
  </Provider>,
  rootElement
);
