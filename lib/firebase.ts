import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth, GoogleAuthProvider } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyB-rczovPFVDkUggbDapezFwz4Qkd_r-oY",
  authDomain: "luckmaths-28bbb.firebaseapp.com",
  projectId: "luckmaths-28bbb",
  storageBucket: "luckmaths-28bbb.firebasestorage.app",
  messagingSenderId: "568341498808",
  appId: "1:568341498808:web:859abba365817585529d4d",
  measurementId: "G-JMBS3BNZEH",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

// Configurar el proveedor de Google
googleProvider.setCustomParameters({
  prompt: "select_account",
})

export { app, db, auth, googleProvider }
