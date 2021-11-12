import * as firebase from 'firebase';
import 'firebase/firestore';
import 'firebase/auth';
import 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDwYv06vmLRodVBWy7Duz6b7tsGOkIPt7o",
  authDomain: "audio-example-expo.firebaseapp.com",
  projectId: "audio-example-expo",
  storageBucket: "audio-example-expo.appspot.com",
  messagingSenderId: "99320940161",
  appId: "1:99320940161:web:5a7320e0516d8c1433ef80"
};

let app;

if (firebase.apps.length === 0) {
	app = firebase.initializeApp(firebaseConfig);
  firebase.firestore().settings({ experimentalForceLongPolling: true });
} else {
	app = firebase.app();
}

const db = app.firestore();
const auth = app.auth();
// Get a reference to the storage service, which is used to create references in your storage bucket
// Web version 8 (namespaced)
// source: https://firebase.google.com/docs/storage/web/start#web-version-8
const storage = app.storage().ref()

export { db, auth, storage };