import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCUBymUxDZfEVx_YVKkkCuZC6fGZO7s3fc",
  authDomain: "velaanmilk.firebaseapp.com",
  databaseURL: "https://velaanmilk-default-rtdb.firebaseio.com",
  projectId: "velaanmilk",
  storageBucket: "velaanmilk.firebasestorage.app",
  messagingSenderId: "866934507233",
  appId: "1:866934507233:web:ea08e484786eca44f719a0",
  measurementId: "G-NE5H710KHD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);
