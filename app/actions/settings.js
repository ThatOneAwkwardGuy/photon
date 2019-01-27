export const UPDATE_SETTINGS = 'UPDATE_SETTINGS';
export const ADD_CUSTOM_SITE = 'ADD_CUSTOM_SITE';
export const REMOVE_CUSTOM_SITE = 'REMOVE_CUSTOM_SITE';

export function updateSettings(settings) {
  return {
    type: UPDATE_SETTINGS,
    payload: settings
  };
}

export function addCustomSite(site) {
  return {
    type: ADD_CUSTOM_SITE,
    payload: site
  };
}

export function removeCustomSite(site) {
  return {
    type: REMOVE_CUSTOM_SITE,
    payload: site
  };
}
