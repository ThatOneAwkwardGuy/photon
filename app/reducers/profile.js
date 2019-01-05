// @flow
import { ADD_PROFILE, REMOVE_PROFILE } from '../actions/profile';

import { omit } from 'lodash';

export let taskStateType = {};

const initialState = { profiles: {} };

export default function profileReducer(state = initialState, action) {
  switch (action.type) {
    case ADD_PROFILE:
      return Object.assign({}, state, {
        profiles: {
          ...state.profiles,
          [action.payload.profileID]: action.payload
        }
      });
    case REMOVE_PROFILE:
      return {
        ...state,
        profiles: omit(state.profiles, action.payload)
      };
    default:
      return state;
  }
}
