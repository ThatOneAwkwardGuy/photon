import { UPDATE_SETTINGS, ADD_CUSTOM_SITE, REMOVE_CUSTOM_SITE, REMOVE_GOOGLE_ACCOUNT, ADD_GOOGLE_ACCOUNT } from '../actions/settings';
import { stat } from 'fs-extra-p';

const initialState = {
  monitorTime: 1000,
  errorTime: 3000,
  checkoutTime: 2500,
  monitorProxies: [],
  restockMonitorTime: 0,
  monitorForRestock: false,
  retryOnCheckoutError: false,
  customSites: {},
  googleAccounts: {}
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
    case REMOVE_GOOGLE_ACCOUNT:
      return {
        ...state,
        googleAccounts: _.omit(state.googleAccounts, action.payload.email)
      };
    case ADD_GOOGLE_ACCOUNT:
      state.googleAccounts[action.payload.email] = action.payload;
      return state;
    default:
      return state;
  }
}
