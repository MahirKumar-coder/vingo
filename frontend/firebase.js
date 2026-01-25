// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "smart-classroom-schedule-a7562.firebaseapp.com",
  projectId: "smart-classroom-schedule-a7562",
  storageBucket: "smart-classroom-schedule-a7562.firebasestorage.app",
  messagingSenderId: "1015447259510",
  appId: "1:1015447259510:web:cdee4615861f1785cad257",
  measurementId: "G-131VCVVBE9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app)
export { app, auth }