import { database } from "./firebase";

export const returnDatabaseUserInfo = async UID => {
  return await database.ref(`users/${UID}`).once("value");
};

export const setProfileToActive = async UID => {
  return await database
    .ref(`users/${UID}`)
    .child("active1")
    .set(true);
};

export const setProfileToInActive = async UID => {
  return await database
    .ref(`users/${UID}`)
    .child("active1")
    .set(false);
};

export const getProfileActiveState = async UID => {
  return await database
    .ref(`users/${UID}`)
    .child("active1")
    .once("value");
};

export const databaseAuth = database;
