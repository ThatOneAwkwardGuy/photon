import { auth } from "./firebase";

export const doSignInWithEmailAndPassword = (email, password) => auth.signInWithEmailAndPassword(email, password);

export const authorise = auth;
