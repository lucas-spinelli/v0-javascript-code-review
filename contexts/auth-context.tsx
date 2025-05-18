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
import { getProgressFromLocalStorage, initLocalProgress, type LocalUserProgress } from "@/services/storage-service"
import { syncPendingUpdates, refreshUserDataFromFirebase } from "@/services/user-service"

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

  // Función para convertir el progreso local a formato UserProgress
  const convertLocalProgressToUserProgress = (localProgress: LocalUserProgress): UserProgress => {
    return {
      points: localProgress.points,
      level: Math.floor(localProgress.points / 100) + 1, // Calcular nivel basado en puntos
      streak: localProgress.streak,
      lastActive: localProgress.lastActive ? new Date(localProgress.lastActive) : null,
      completedExercises: localProgress.completedExercises,
    }
  }

  // Función para sincronizar datos cuando hay conexión
  const syncDataWithFirebase = async (userId: string) => {
    try {
      await syncPendingUpdates(userId)
    } catch (error) {
      console.error("Error al sincronizar datos con Firebase:", error)
    }
  }

  useEffect(() => {
    if (!isBrowser) return

    // Verificar conexión a internet y sincronizar si está disponible
    const handleOnline = () => {
      console.log("Conexión a internet restablecida")
      if (user) {
        syncDataWithFirebase(user.uid)
      }
    }

    window.addEventListener("online", handleOnline)

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
          // Inicializar progreso local para este usuario
          initLocalProgress(user.uid)

          // Intentar obtener datos de Firebase primero
          const userDocRef = doc(db, "users", user.uid)
          const userDoc = await getDoc(userDocRef)

          if (userDoc.exists()) {
            const userData = userDoc.data() as any

            // Actualizar progreso en memoria
            const progress: UserProgress = {
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
            }

            setUserProgress(progress)

            // Actualizar localStorage con datos de Firebase
            await refreshUserDataFromFirebase(user.uid)
          } else {
            // Si no existe en Firebase, crear nuevo documento
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

            const newProgress: UserProgress = {
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
            }

            setUserProgress(newProgress)
          }

          // Sincronizar actualizaciones pendientes
          await syncDataWithFirebase(user.uid)
        } catch (error) {
          console.error("Error al obtener datos del usuario:", error)

          // Si hay error, intentar usar datos de localStorage
          const localProgress = getProgressFromLocalStorage()
          if (localProgress) {
            setUserProgress(convertLocalProgressToUserProgress(localProgress))
          }
        }
      } else {
        setUserProgress(null)
        // Inicializar progreso local para usuario anónimo
        initLocalProgress(null)
      }

      setLoading(false)
    })

    return () => {
      window.removeEventListener("online", handleOnline)
      unsubscribe()
    }
  }, [isBrowser, toast])

  // Función para iniciar sesión con Google
  const signInWithGoogle = async () => {
    if (!isBrowser) return

    try {
      console.log("Intentando iniciar sesión con Google...")

      // Abrir una nueva ventana para la autenticación
      const authWindow = window.open("about:blank", "_blank", "width=600,height=600")

      if (!authWindow) {
        console.error("No se pudo abrir la ventana de autenticación")
        toast({
          title: "Error",
          description: "No se pudo abrir la ventana de autenticación. Por favor, permite ventanas emergentes.",
          variant: "destructive",
        })
        return
      }

      // Configurar el proveedor para usar la nueva ventana
      googleProvider.setCustomParameters({
        prompt: "select_account",
        display: "popup",
      })

      // Mensaje para el usuario
      toast({
        title: "Iniciando sesión",
        description: "Se ha abierto una ventana para iniciar sesión con Google.",
        variant: "default",
      })

      try {
        // Usar signInWithPopup pero dirigido a la nueva ventana
        // Nota: En una app real, esto requeriría implementación nativa
        const result = await signInWithPopup(auth, googleProvider)
        console.log("Inicio de sesión exitoso:", result.user.displayName)

        // Cerrar la ventana de autenticación
        authWindow.close()
      } catch (popupError: any) {
        console.warn("Error con popup:", popupError.message)

        // Si falla, cerrar la ventana y mostrar mensaje
        authWindow.close()

        toast({
          title: "Error de inicio de sesión",
          description: "Hubo un problema al iniciar sesión. Intentando método alternativo...",
          variant: "destructive",
        })

        // Intentar con redirección como respaldo
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
