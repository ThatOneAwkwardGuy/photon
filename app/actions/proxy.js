export const ADD_PROXIES = 'ADD_PROXIES';

export function addProxies(proxies) {
  return {
    type: ADD_PROXIES,
    payload: proxies
  };
}
