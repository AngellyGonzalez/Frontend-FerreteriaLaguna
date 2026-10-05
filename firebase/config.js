// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // <<< 1. Importa getAuth
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD8Kutvibyl_bOpr4Rr7oCBapI9ERxRHi0",
  authDomain: "backendlagutexmovil.firebaseapp.com",
  projectId: "backendlagutexmovil",
  storageBucket: "backendlagutexmovil.firebasestorage.app",
  messagingSenderId: "697373535072",
  appId: "1:697373535072:web:b8e9282ef8696e0c620c05",
  measurementId: "G-2474WGLVK3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


export const db = getFirestore(app);
export const auth = getAuth(app);