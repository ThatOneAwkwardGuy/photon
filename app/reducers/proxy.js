// @flow
import { ADD_PROXIES } from '../actions/proxy';

const initialState = { proxies: [] };

export default function proxyReducer(state = initialState, action) {
  switch (action.type) {
  case ADD_PROXIES:
    return {
      proxies: action.payload
    };
  default:
    return state;
  }
}
