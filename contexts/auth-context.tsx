"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import {
  type User,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { auth, googleProvider, db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"

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
  const { toast } = useToast()

  // Verificar si estamos en el navegador
  const isBrowser = typeof window !== "undefined"

  useEffect(() => {
    if (!isBrowser) return

    // Manejar el resultado de la redirección al cargar la página
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth)
        if (result?.user) {
          console.log("Usuario autenticado por redirección:", result.user.displayName)
        }
      } catch (error) {
        console.error("Error al manejar la redirección:", error)
        toast({
          title: "Error de inicio de sesión",
          description: "Hubo un problema al iniciar sesión. Por favor, intenta de nuevo.",
          variant: "destructive",
        })
      }
    }

    handleRedirectResult()

    // Suscribirse a los cambios de estado de autenticación
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Estado de autenticación cambiado:", user?.displayName || "No autenticado")
      setUser(user)

      if (user) {
        try {
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
        } catch (error) {
          console.error("Error al obtener datos del usuario:", error)
        }
      } else {
        setUserProgress(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [isBrowser, toast])

  // Función para iniciar sesión con Google
  const signInWithGoogle = async () => {
    if (!isBrowser) return

    try {
      console.log("Intentando iniciar sesión con Google...")

      // Primero intentamos con popup
      try {
        const result = await signInWithPopup(auth, googleProvider)
        console.log("Inicio de sesión con popup exitoso:", result.user.displayName)
        return
      } catch (popupError: any) {
        console.warn("Error con popup, intentando redirección:", popupError.message)

        // Si falla el popup, intentamos con redirección
        await signInWithRedirect(auth, googleProvider)
      }
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error)
      toast({
        title: "Error de inicio de sesión",
        description: "No se pudo iniciar sesión con Google. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    }
  }

  // Función para cerrar sesión
  const signOut = async () => {
    if (!isBrowser) return

    try {
      await firebaseSignOut(auth)
      console.log("Sesión cerrada correctamente")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
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
