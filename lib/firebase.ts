import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyBDtrJSzqnI6GWVhGKkieqq0EwUBnqmDIA",
  authDomain: "dougies-7356f.firebaseapp.com",
  projectId: "dougies-7356f",
  storageBucket: "dougies-7356f.firebasestorage.app",
  messagingSenderId: "807239650263",
  appId: "1:807239650263:web:86e66d8c93e235a8685992",
  measurementId: "G-X549VDX723",
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
const auth = getAuth(app)
const db = getFirestore(app)
const googleProvider = new GoogleAuthProvider()

export { app, auth, db, googleProvider }
