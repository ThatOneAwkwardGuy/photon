import { ADD_PROXIES, DELETE_ALL_PROXIES } from '../actions/proxy';

const initialState = { proxies: [] };

export default function proxyReducer(state = initialState, action) {
  switch (action.type) {
    case ADD_PROXIES:
      return {
        proxies: action.payload
      };
    case DELETE_ALL_PROXIES:
      return {
        proxies: []
      };
    default:
      return state;
  }
}
