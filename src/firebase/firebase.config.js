// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
	apiKey: 'AIzaSyDlbkVLI_26tuYSodzrPc4ogZhdLyg-a38',
	authDomain: 'housing-marketplace-c159e.firebaseapp.com',
	projectId: 'housing-marketplace-c159e',
	storageBucket: 'housing-marketplace-c159e.appspot.com',
	messagingSenderId: '1031639780366',
	appId: '1:1031639780366:web:c322e8585751949365005f',
};

// Initialize Firebase
initializeApp(firebaseConfig);

export const db = getFirestore();
export const auth = getAuth();
const storage = getStorage();

if (process.env.NODE_ENV !== 'production') {
	connectFirestoreEmulator(db, 'localhost', 8080);
	connectAuthEmulator(auth, 'http://localhost:9099');
	connectStorageEmulator(storage, 'localhost', 9199);
}
