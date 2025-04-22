import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database"; // Import Realtime Database

const firebaseConfig = {
  apiKey: "AIzaSyDYMZVQrz2AT5s5tnbLYL5ET0_vpbjVbBg",
  authDomain: "hostelhub-59448.firebaseapp.com",
  databaseURL: "https://hostelhub-59448-default-rtdb.firebaseio.com",
  projectId: "hostelhub-59448",
  storageBucket: "hostelhub-59448.appspot.com",
  messagingSenderId: "856661700083",
  appId: "1:856661700083:web:822a20e34288ed3261b686",
  measurementId: "G-2DF2Q59ZY5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const realtimeDB = getDatabase(app); // Export Realtime Database

export default app;