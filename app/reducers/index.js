// import { combineReducers } from 'redux';
// import { routerReducer as router } from 'react-router-redux';
// import taskReducer from './task';
// import profileReducer from './profile';
// import proxyReducer from './proxy';
// import settingsReducer from './settings';

// const rootReducer = combineReducers({
//   taskReducer,
//   profileReducer,
//   proxyReducer,
//   settingsReducer,
//   router
// });

// export default rootReducer;

import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import taskReducer from './task';
import profileReducer from './profile';
import proxyReducer from './proxy';
import settingsReducer from './settings';

export default history =>
  combineReducers({
    router: connectRouter(history),
    taskReducer,
    profileReducer,
    proxyReducer,
    settingsReducer
  });
