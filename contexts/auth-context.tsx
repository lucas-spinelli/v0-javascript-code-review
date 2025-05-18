"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { type User, signOut as firebaseSignOut, onAuthStateChanged } from "firebase/auth"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { auth, googleProvider, db } from "@/lib/firebase"

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  userProgress: UserProgress | null
}

interface UserProgress {
  points: number
  level: number
  streak: number
  lastActive: Date | null
  completedExercises: {
    addition: number
    subtraction: number
    multiplication: number
    division: number
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)

      if (user) {
        // Fetch user progress from Firestore
        const userDocRef = doc(db, "users", user.uid)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          const userData = userDoc.data() as any
          setUserProgress({
            points: userData.points || 0,
            level: userData.level || 1,
            streak: userData.streak || 0,
            lastActive: userData.lastActive ? new Date(userData.lastActive.toDate()) : null,
            completedExercises: userData.completedExercises || {
              addition: 0,
              subtraction: 0,
              multiplication: 0,
              division: 0,
            },
          })
        } else {
          // Create new user document if it doesn't exist
          const newUserData = {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            lastActive: serverTimestamp(),
            points: 0,
            level: 1,
            streak: 0,
            completedExercises: {
              addition: 0,
              subtraction: 0,
              multiplication: 0,
              division: 0,
            },
          }

          await setDoc(userDocRef, newUserData)
          setUserProgress({
            points: 0,
            level: 1,
            streak: 0,
            lastActive: new Date(),
            completedExercises: {
              addition: 0,
              subtraction: 0,
              multiplication: 0,
              division: 0,
            },
          })
        }
      } else {
        setUserProgress(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Modificar el método de inicio de sesión para usar redirección en lugar de popup
  const signInWithGoogle = async () => {
    try {
      // Usar signInWithRedirect en lugar de signInWithPopup
      const { signInWithRedirect } = await import("firebase/auth")
      await signInWithRedirect(auth, googleProvider)
    } catch (error) {
      console.error("Error signing in with Google:", error)
      // Mostrar un mensaje de error más descriptivo
      if (error instanceof Error) {
        console.error("Error message:", error.message)
        console.error("Error code:", (error as any).code)
      }
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, userProgress }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
