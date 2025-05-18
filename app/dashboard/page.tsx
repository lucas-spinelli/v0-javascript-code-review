"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Plus, Minus, X, Divide, Award, Flame, LogOut, User, ArrowRight } from "lucide-react"
import Image from "next/image"
import { calculateLevel } from "@/services/user-service"

export default function DashboardPage() {
  const { user, loading, signOut, userProgress } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [loading, user, router])

  if (loading || !user || !userProgress) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  const level = calculateLevel(userProgress.points)
  const pointsForNextLevel = level * 100
  const pointsInCurrentLevel = userProgress.points - (level - 1) * 100
  const progressPercentage = (pointsInCurrentLevel / 100) * 100

  const exerciseTypes = [
    {
      name: "Sumas",
      icon: <Plus className="h-8 w-8 text-white" />,
      color: "bg-green-500",
      path: "/practice/addition",
      completed: userProgress.completedExercises.addition,
    },
    {
      name: "Restas",
      icon: <Minus className="h-8 w-8 text-white" />,
      color: "bg-blue-500",
      path: "/practice/subtraction",
      completed: userProgress.completedExercises.subtraction,
    },
    {
      name: "Multiplicaciones",
      icon: <X className="h-8 w-8 text-white" />,
      color: "bg-purple-500",
      path: "/practice/multiplication",
      completed: userProgress.completedExercises.multiplication,
    },
    {
      name: "Divisiones",
      icon: <Divide className="h-8 w-8 text-white" />,
      color: "bg-orange-500",
      path: "/practice/division",
      completed: userProgress.completedExercises.division,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100">
      <div className="container mx-auto px-4 py-6">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-green-600">LuckMaths</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <Flame className="h-5 w-5 text-orange-500 mr-1" />
              <span className="font-bold">{userProgress.streak} días</span>
            </div>
            <div className="flex items-center">
              <Award className="h-5 w-5 text-yellow-500 mr-1" />
              <span className="font-bold">{userProgress.points} XP</span>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <Card className="col-span-1 md:col-span-2">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL || "/placeholder.svg"}
                      alt={user.displayName || "Usuario"}
                      width={60}
                      height={60}
                      className="rounded-full mr-4"
                    />
                  ) : (
                    <div className="bg-green-100 p-3 rounded-full mr-4">
                      <User className="h-8 w-8 text-green-600" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold">{user.displayName || "Usuario"}</h2>
                    <p className="text-gray-500">{user.email}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Nivel {level}</span>
                    <span className="text-gray-500">
                      {pointsInCurrentLevel}/{100} XP
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <div className="bg-orange-100 p-2 rounded-full mr-3">
                      <Flame className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Racha actual</p>
                      <p className="font-bold">{userProgress.streak} días</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="bg-yellow-100 p-2 rounded-full mr-3">
                      <Award className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Puntos totales</p>
                      <p className="font-bold">{userProgress.points} XP</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-bold mb-4">Estadísticas</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Ejercicios completados</p>
                    <p className="font-bold text-2xl">
                      {Object.values(userProgress.completedExercises).reduce((a, b) => a + b, 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Nivel actual</p>
                    <p className="font-bold text-2xl">{level}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Siguiente nivel</p>
                    <p className="text-sm">
                      Faltan {pointsForNextLevel - userProgress.points} XP para el nivel {level + 1}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <h3 className="text-xl font-bold mb-6">Elige un ejercicio para practicar</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {exerciseTypes.map((type, index) => (
              <Card
                key={index}
                className="border-2 border-gray-200 hover:border-green-500 transition-all cursor-pointer"
                onClick={() => router.push(type.path)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className={`${type.color} p-4 rounded-full mb-4`}>{type.icon}</div>
                    <h4 className="text-lg font-semibold mb-2">{type.name}</h4>
                    <p className="text-gray-500 mb-4">{type.completed} ejercicios completados</p>
                    <Button variant="outline" className="w-full">
                      Practicar <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>

        <footer className="text-center text-gray-500 py-4">
          <p>© 2025 LuckMaths. Todos los derechos reservados.</p>
        </footer>
      </div>
    </div>
  )
}
