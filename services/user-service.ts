import { db } from "@/lib/firebase"
import { doc, updateDoc, increment, serverTimestamp } from "firebase/firestore"

export async function updateUserPoints(userId: string, pointsToAdd: number) {
  const userRef = doc(db, "users", userId)

  await updateDoc(userRef, {
    points: increment(pointsToAdd),
    lastActive: serverTimestamp(),
  })

  return pointsToAdd
}

export async function updateExerciseCompletion(
  userId: string,
  exerciseType: "addition" | "subtraction" | "multiplication" | "division",
) {
  const userRef = doc(db, "users", userId)

  const field = `completedExercises.${exerciseType}`

  await updateDoc(userRef, {
    [field]: increment(1),
    lastActive: serverTimestamp(),
  })
}

export async function updateUserStreak(userId: string) {
  const userRef = doc(db, "users", userId)

  await updateDoc(userRef, {
    streak: increment(1),
    lastActive: serverTimestamp(),
  })
}

export function calculateLevel(points: number): number {
  // Simple level calculation: every 100 points is a new level
  return Math.floor(points / 100) + 1
}
