import { UPDATE_SETTINGS } from '../actions/settings';

const initialState = {
  monitorTime: 1000,
  errorTime: 3000,
  checkoutTime: 2500,
  monitorProxies: []
};

export default function settingsReducer(state = initialState, action) {
  switch (action.type) {
    case UPDATE_SETTINGS:
      return action.payload;
    default:
      return state;
  }
}
