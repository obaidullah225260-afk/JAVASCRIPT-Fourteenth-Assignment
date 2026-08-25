import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBMeoXbLwTKwRoGAPAdECb5fqOtDcxfBQk",
  authDomain: "postblogapp-b6cd9.firebaseapp.com",
  projectId: "postblogapp-b6cd9",
  storageBucket: "postblogapp-b6cd9.firebasestorage.app",
  messagingSenderId: "785316763542",
  appId: "1:785316763542:web:954321649203a9f2e6efb7",
  measurementId: "G-L8ZPXYN519",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
