import { UPDATE_SETTINGS, ADD_CUSTOM_SITE, REMOVE_CUSTOM_SITE } from '../actions/settings';

const initialState = {
  monitorTime: 1000,
  errorTime: 3000,
  checkoutTime: 2500,
  monitorProxies: [],
  restockMonitorTime: 0,
  monitorForRestock: false,
  retryOnCheckoutError: false,
  customSites: {}
};

export default function settingsReducer(state = initialState, action) {
  switch (action.type) {
    case UPDATE_SETTINGS:
      return action.payload;
    case ADD_CUSTOM_SITE:
      state.customSites[action.payload.name] = action.payload.url;
      return state;
    case REMOVE_CUSTOM_SITE:
      return {
        ...state,
        customSites: _.omit(state.customSites, [action.payload])
      };
    default:
      return state;
  }
}
