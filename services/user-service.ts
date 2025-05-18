import { db } from "@/lib/firebase"
import { doc, updateDoc, increment, serverTimestamp, getDoc } from "firebase/firestore"
import {
  addPendingUpdate,
  getProgressFromLocalStorage,
  updateLocalProgress,
  clearPendingUpdates,
} from "./storage-service"

// Función para sincronizar actualizaciones pendientes con Firebase
export async function syncPendingUpdates(userId: string) {
  const localProgress = getProgressFromLocalStorage()
  if (!localProgress || !localProgress.pendingUpdates.length) return

  const userRef = doc(db, "users", userId)

  try {
    for (const update of localProgress.pendingUpdates) {
      switch (update.type) {
        case "points":
          await updateDoc(userRef, {
            points: increment(update.value),
            lastActive: serverTimestamp(),
          })
          break
        case "exercise":
          const field = `completedExercises.${update.value}`
          await updateDoc(userRef, {
            [field]: increment(1),
            lastActive: serverTimestamp(),
          })
          break
        case "streak":
          await updateDoc(userRef, {
            streak: increment(1),
            lastActive: serverTimestamp(),
          })
          break
      }
    }

    // Limpiar actualizaciones pendientes después de sincronizar
    clearPendingUpdates()

    // Actualizar datos locales con los más recientes de Firebase
    await refreshUserDataFromFirebase(userId)

    console.log("Sincronización completada con éxito")
  } catch (error) {
    console.error("Error al sincronizar con Firebase:", error)
  }
}

// Función para actualizar los datos locales desde Firebase
export async function refreshUserDataFromFirebase(userId: string) {
  try {
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      const userData = userDoc.data()

      // Actualizar datos locales
      updateLocalProgress("points", userData.points || 0)
      updateLocalProgress("level", userData.level || 1)
      updateLocalProgress("streak", userData.streak || 0)
      updateLocalProgress(
        "lastActive",
        userData.lastActive ? new Date(userData.lastActive.toDate()).toISOString() : null,
      )
      updateLocalProgress(
        "completedExercises",
        userData.completedExercises || {
          addition: 0,
          subtraction: 0,
          multiplication: 0,
          division: 0,
        },
      )

      console.log("Datos actualizados desde Firebase")
    }
  } catch (error) {
    console.error("Error al actualizar datos desde Firebase:", error)
  }
}

export async function updateUserPoints(userId: string, pointsToAdd: number) {
  // Actualizar localStorage primero
  const localProgress = getProgressFromLocalStorage()
  if (localProgress) {
    localProgress.points += pointsToAdd
    updateLocalProgress("points", localProgress.points)
  }

  // Añadir a actualizaciones pendientes
  addPendingUpdate("points", pointsToAdd)

  try {
    // Intentar actualizar Firebase
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      points: increment(pointsToAdd),
      lastActive: serverTimestamp(),
    })

    // Si tiene éxito, sincronizar otras actualizaciones pendientes
    await syncPendingUpdates(userId)
  } catch (error) {
    console.error("Error al actualizar puntos en Firebase:", error)
    // No hacemos nada, ya que los datos están en localStorage y se sincronizarán después
  }

  return pointsToAdd
}

export async function updateExerciseCompletion(
  userId: string,
  exerciseType: "addition" | "subtraction" | "multiplication" | "division",
) {
  // Actualizar localStorage primero
  const localProgress = getProgressFromLocalStorage()
  if (localProgress && localProgress.completedExercises) {
    localProgress.completedExercises[exerciseType]++
    updateLocalProgress("completedExercises", localProgress.completedExercises)
  }

  // Añadir a actualizaciones pendientes
  addPendingUpdate("exercise", exerciseType)

  try {
    // Intentar actualizar Firebase
    const userRef = doc(db, "users", userId)
    const field = `completedExercises.${exerciseType}`
    await updateDoc(userRef, {
      [field]: increment(1),
      lastActive: serverTimestamp(),
    })

    // Si tiene éxito, sincronizar otras actualizaciones pendientes
    await syncPendingUpdates(userId)
  } catch (error) {
    console.error(`Error al actualizar ejercicio ${exerciseType} en Firebase:`, error)
    // No hacemos nada, ya que los datos están en localStorage y se sincronizarán después
  }
}

export async function updateUserStreak(userId: string) {
  // Actualizar localStorage primero
  const localProgress = getProgressFromLocalStorage()
  if (localProgress) {
    localProgress.streak++
    updateLocalProgress("streak", localProgress.streak)
  }

  // Añadir a actualizaciones pendientes
  addPendingUpdate("streak", 1)

  try {
    // Intentar actualizar Firebase
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      streak: increment(1),
      lastActive: serverTimestamp(),
    })

    // Si tiene éxito, sincronizar otras actualizaciones pendientes
    await syncPendingUpdates(userId)
  } catch (error) {
    console.error("Error al actualizar racha en Firebase:", error)
    // No hacemos nada, ya que los datos están en localStorage y se sincronizarán después
  }
}

export function calculateLevel(points: number): number {
  // Simple level calculation: every 100 points is a new level
  return Math.floor(points / 100) + 1
}
