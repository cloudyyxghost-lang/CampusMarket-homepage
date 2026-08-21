import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";



// Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyAUe6SgfATE5SOHK2vRWtywudekAtjiYqQ",
    authDomain: "school-marketplace-74e9e.firebaseapp.com",
    projectId: "school-marketplace-74e9e",
    storageBucket: "school-marketplace-74e9e.firebasestorage.app",
    messagingSenderId: "367653544012",
    appId: "1:367653544012:web:ddc4b891665621b3f594e9",
    measurementId: "G-7XPRV4EPXN"
  };



const app =
    initializeApp(
        firebaseConfig
    );


const auth =
    getAuth(
        app
    );


const db =
    getFirestore(
        app
    );


export {
    app,
    auth,
    db
};