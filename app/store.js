import { createStore, applyMiddleware, compose } from 'redux';
import { routerMiddleware } from 'react-router-redux';
import persistState from 'redux-localstorage';
import thunk from 'redux-thunk';
import rootReducer from './reducers/index';
import { createMemoryHistory } from 'history';

export default function configureStore(initialState, routerHistory) {
  const router = routerMiddleware(routerHistory);

  const actionCreators = {};

  const middlewares = [thunk, router];

  const composeEnhancers = (() => {
    const compose_ = window && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;
    if (process.env.NODE_ENV === 'development' && compose_) {
      return compose_({ actionCreators });
    }
    return compose;
  })();

  const history = createMemoryHistory();

  const enhancer = composeEnhancers(applyMiddleware(...middlewares), persistState());

  return createStore(rootReducer(history), initialState, enhancer);
}

// import { createBrowserHistory } from 'history';
// import { applyMiddleware, compose, createStore } from 'redux';
// import { routerMiddleware } from 'connected-react-router';
// import createRootReducer from './reducers';

// const history = createBrowserHistory();

// const store = createStore(createRootReducer(history), initialState, compose(applyMiddleware(routerMiddleware(history))));
