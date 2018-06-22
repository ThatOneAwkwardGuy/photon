export const ADD_PROFILE = 'ADD_PROFILE';
export const REMOVE_PROFILE = 'REMOVE_PROFILE';

export function addProfile(profile) {
  return {
    type: ADD_PROFILE,
    id: profile.profileID,
    payload: profile
  };
}

export function removeProfile(profile) {
  return {
    type: REMOVE_PROFILE,
    id: profile,
    payload: profile
  };
}
