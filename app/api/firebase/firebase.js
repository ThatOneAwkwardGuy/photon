import * as firebase from "firebase";

const prodConfig = {
  apiKey: "AIzaSyBIhzR3KT792-UJBRNgd2wmM9exbZsZh3I",
  authDomain: "photon-bot.firebaseapp.com",
  databaseURL: "https://photon-bot.firebaseio.com",
  projectId: "photon-bot",
  storageBucket: "photon-bot.appspot.com",
  messagingSenderId: "518062381695"
};

// const devConfig = {
//   apiKey: "AIzaSyDcRM2-gJ-5riqluic46EzSWkvBgFWA7lA",
//   authDomain: "photon-dev-7a3d4.firebaseapp.com",
//   databaseURL: "https://photon-dev-7a3d4.firebaseio.com",
//   projectId: "photon-dev-7a3d4",
//   storageBucket: "photon-dev-7a3d4.appspot.com",
//   messagingSenderId: "891547964320"
// };

// const config = process.env.NODE_ENV === "production" ? prodConfig : devConfig;

// if (!firebase.apps.length) {
//   firebase.initializeApp(config);
// }

firebase.initializeApp(prodConfig);

const auth = firebase.auth();
const database = firebase.database();
const firestore = firebase.firestore();

const settings = { timestampsInSnapshots: true };
firestore.settings(settings);

export { auth, database, firestore };
