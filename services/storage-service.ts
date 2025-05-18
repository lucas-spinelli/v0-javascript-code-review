// Servicio para manejar la sincronización con localStorage

// Tipos para el almacenamiento local
export interface LocalUserProgress {
  userId: string | null
  points: number
  level: number
  streak: number
  lastActive: string | null
  completedExercises: {
    addition: number
    subtraction: number
    multiplication: number
    division: number
  }
  pendingUpdates: PendingUpdate[]
}

export interface PendingUpdate {
  type: "points" | "exercise" | "streak"
  value: any
  timestamp: number
}

// Clave para almacenar en localStorage
const STORAGE_KEY = "luckmaths_user_progress"

// Guardar progreso en localStorage
export function saveProgressToLocalStorage(progress: LocalUserProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    console.log("Progreso guardado en localStorage")
  } catch (error) {
    console.error("Error al guardar progreso en localStorage:", error)
  }
}

// Obtener progreso de localStorage
export function getProgressFromLocalStorage(): LocalUserProgress | null {
  try {
    const storedProgress = localStorage.getItem(STORAGE_KEY)
    if (storedProgress) {
      return JSON.parse(storedProgress)
    }
    return null
  } catch (error) {
    console.error("Error al obtener progreso de localStorage:", error)
    return null
  }
}

// Añadir una actualización pendiente
export function addPendingUpdate(type: "points" | "exercise" | "streak", value: any): void {
  try {
    const progress = getProgressFromLocalStorage()
    if (progress) {
      progress.pendingUpdates.push({
        type,
        value,
        timestamp: Date.now(),
      })
      saveProgressToLocalStorage(progress)
    }
  } catch (error) {
    console.error("Error al añadir actualización pendiente:", error)
  }
}

// Limpiar actualizaciones pendientes
export function clearPendingUpdates(): void {
  try {
    const progress = getProgressFromLocalStorage()
    if (progress) {
      progress.pendingUpdates = []
      saveProgressToLocalStorage(progress)
    }
  } catch (error) {
    console.error("Error al limpiar actualizaciones pendientes:", error)
  }
}

// Actualizar progreso local
export function updateLocalProgress(
  field: keyof Omit<LocalUserProgress, "userId" | "pendingUpdates">,
  value: any,
): void {
  try {
    const progress = getProgressFromLocalStorage()
    if (progress) {
      // @ts-ignore - Necesario para actualizar campos anidados
      progress[field] = value
      saveProgressToLocalStorage(progress)
    }
  } catch (error) {
    console.error(`Error al actualizar ${field} en localStorage:`, error)
  }
}

// Inicializar progreso local para un usuario
export function initLocalProgress(userId: string | null): void {
  const existingProgress = getProgressFromLocalStorage()

  // Si ya existe progreso para este usuario, no lo sobrescribimos
  if (existingProgress && existingProgress.userId === userId) {
    return
  }

  const newProgress: LocalUserProgress = {
    userId,
    points: 0,
    level: 1,
    streak: 0,
    lastActive: null,
    completedExercises: {
      addition: 0,
      subtraction: 0,
      multiplication: 0,
      division: 0,
    },
    pendingUpdates: [],
  }

  saveProgressToLocalStorage(newProgress)
}
