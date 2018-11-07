export const ADD_PROXIES = 'ADD_PROXIES';
export const DELETE_ALL_PROXIES = 'DELETE_ALL_PROXIES';

export function addProxies(proxies) {
  return {
    type: ADD_PROXIES,
    payload: proxies
  };
}

export function deleteAllProxies() {
  return {
    type: DELETE_ALL_PROXIES,
    payload: {}
  };
}
