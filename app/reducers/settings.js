import { UPDATE_SETTINGS } from "../actions/settings";

const initialState = {
  monitorTime: 0,
  errorTime: 0,
  checkoutTime: 0,
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
