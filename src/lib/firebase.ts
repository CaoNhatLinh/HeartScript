import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyATlKVSQ8Gar_Wq4AbADLbrqANrBafAHhk",
    authDomain: "createai-6f01c.firebaseapp.com",
    databaseURL: "https://createai-6f01c-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "createai-6f01c",
    storageBucket: "createai-6f01c.firebasestorage.app",
    messagingSenderId: "125732062562",
    appId: "1:125732062562:web:d421ccbb98159d692bd83b"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

export { app, auth, db, rtdb };
