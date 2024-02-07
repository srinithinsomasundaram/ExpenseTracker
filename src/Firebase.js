import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
  apiKey: "AIzaSyAMEjmyDGUHed5xmtMyj5SzC_BO0aucmmg",
  authDomain: "expensetracker-6d16d.firebaseapp.com",
  databaseURL: "https://expensetracker-6d16d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "expensetracker-6d16d",
  storageBucket: "expensetracker-6d16d.appspot.com",
  messagingSenderId: "1001793219568",
  appId: "1:1001793219568:web:a453ad1b6a74009b154b35",
  measurementId: "G-EST94GCRGQ",

  databaseURL: 'https://expensetracker-6d16d-default-rtdb.asia-southeast1.firebasedatabase.app/',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app); 
const db = getFirestore(app);

export { app, auth, db };

