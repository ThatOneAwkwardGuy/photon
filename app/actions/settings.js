export const UPDATE_SETTINGS = "UPDATE_SETTINGS";

export function updateSettings(settings) {
  return {
    type: UPDATE_SETTINGS,
    payload: settings
  };
}
