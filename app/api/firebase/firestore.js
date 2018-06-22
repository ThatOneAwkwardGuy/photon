import { firestore } from "./firebase";

export const returnDatabaseUserInfo = async UID => {
  return await firestore
    .collection(`users`)
    .doc(UID)
    .get();
};

export const returnHypedReleasesWithinNextWeek = async () => {
  const thisWeek = new Date();
  const nextWeek = new Date(thisWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
  return await firestore
    .collection(`hyped_releases`)
    .where("releaseDate", ">=", thisWeek)
    .where("releaseDate", "<=", nextWeek)
    .get();
};

export const setUserToCurrentlyActive = async UID => {
  await firestore
    .collection(`users`)
    .doc(UID)
    .update({ currentlyActive: true });
};

export const setUserToCurrentlyInactive = async UID => {
  await firestore
    .collection(`users`)
    .doc(UID)
    .update({ currentlyActive: false });
};

export const checkIfUserIsCurrentlyActive = async UID => {
  const response = await firestore
    .collection(`users`)
    .doc(UID)
    .get();
  const activeStatus = response.data().currentlyActive;
  return activeStatus;
};
