import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD3h9y5eaTigtS5KK1oBcYlpvtITMtrH8Q",
  authDomain: "cannafriend-7899f.firebaseapp.com",
  projectId: "cannafriend-7899f",
  storageBucket: "cannafriend-7899f.firebasestorage.app",
  messagingSenderId: "670182976",
  appId: "1:670182976:web:fda8c96ad5a8e9a4d9f9a5",
  measurementId: "G-6KKBWF76CX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const googleProvider = new GoogleAuthProvider()

// Configure Google Auth provider
googleProvider.setCustomParameters({
  prompt: "select_account",
})
