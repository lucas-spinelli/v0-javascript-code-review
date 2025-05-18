"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Calculator, Award, LogIn } from "lucide-react"
import Image from "next/image"

export default function HomePage() {
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard")
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  const handleLogin = async () => {
    console.log("Botón de inicio de sesión clickeado")
    await signInWithGoogle()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center">
            <Calculator className="h-8 w-8 text-green-600 mr-2" />
            <h1 className="text-3xl font-bold text-green-600">LuckMaths</h1>
          </div>
          <Button onClick={handleLogin} className="bg-green-600 hover:bg-green-700">
            <LogIn className="h-4 w-4 mr-2" />
            Iniciar con Google
          </Button>
        </header>

        <main>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-4xl font-bold text-gray-800 mb-6">Aprende matemáticas de forma divertida</h2>
              <p className="text-xl text-gray-600 mb-8">
                LuckMaths te ayuda a dominar las matemáticas con ejercicios interactivos, seguimiento de progreso y un
                sistema de recompensas que te mantiene motivado.
              </p>
              <Button
                onClick={handleLogin}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-lg px-8 py-6 h-auto"
              >
                Comenzar ahora
              </Button>
            </div>
            <div className="flex justify-center">
              <div className="relative w-80 h-80">
                <Image
                  src="/placeholder.svg?height=320&width=320"
                  alt="Estudiantes aprendiendo matemáticas"
                  width={320}
                  height={320}
                  className="rounded-lg shadow-xl"
                />
              </div>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-center text-gray-800 mb-8">¿Por qué elegir LuckMaths?</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="border-green-200 shadow-md">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-green-100 p-3 rounded-full mb-4">
                    <Calculator className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="text-xl font-semibold mb-2">Ejercicios Interactivos</h4>
                  <p className="text-gray-600">
                    Practica sumas, restas, multiplicaciones y divisiones con ejercicios adaptados a tu nivel.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 shadow-md">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-green-100 p-3 rounded-full mb-4">
                    <Award className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="text-xl font-semibold mb-2">Sistema de Recompensas</h4>
                  <p className="text-gray-600">
                    Gana puntos, sube de nivel y mantén rachas diarias para mantenerte motivado.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 shadow-md">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-green-100 p-3 rounded-full mb-4">
                    <BookOpen className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="text-xl font-semibold mb-2">Seguimiento de Progreso</h4>
                  <p className="text-gray-600">Visualiza tu avance y mejora continua con estadísticas detalladas.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <footer className="text-center text-gray-500 py-8">
          <p>© 2025 LuckMaths. Todos los derechos reservados.</p>
        </footer>
      </div>
    </div>
  )
}
