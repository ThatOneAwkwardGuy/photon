import { UPDATE_SETTINGS } from '../actions/settings';

const initialState = {
  monitorTime: 60000,
  errorTime: 60000,
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
