// import { initializeApp } from "firebase/app";
// import { getFirestore, collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc } from "firebase/firestore";

// const firebaseConfig = {
//   apiKey: "SUA_API_KEY",
//   authDomain: "SEU_AUTH_DOMAIN",
//   projectId: "SEU_PROJECT_ID",
//   storageBucket: "SEU_STORAGE_BUCKET",
//   messagingSenderId: "SEU_SENDER_ID",
//   appId: "SEU_APP_ID"
// };

// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);

// export { db, collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc };

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAHa7mPuFtdFGEEXdW5BgLu_7RPLBmI1Yo",
  authDomain: "taskmanagersync-c9194.firebaseapp.com",
  projectId: "taskmanagersync-c9194",
  storageBucket: "taskmanagersync-c9194.firebasestorage.app",
  messagingSenderId: "242099450025",
  appId: "1:242099450025:web:946de1cd3ee02257a979b8"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Exporta para uso em outros scripts
export { db, auth, collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc };
