"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Trophy, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import confetti from "canvas-confetti"
import { useAuth } from "@/contexts/auth-context"
import { updateUserPoints, updateExerciseCompletion, updateUserStreak } from "@/services/user-service"

type Operation = "+" | "-" | "×" | "÷"
type OperationType = "addition" | "subtraction" | "multiplication" | "division"

interface Question {
  num1: number
  num2: number
  operation: Operation
  correctAnswer: number
  options: number[]
}

const operationMapping: Record<OperationType, Operation> = {
  addition: "+",
  subtraction: "-",
  multiplication: "×",
  division: "÷",
}

const operationTitles: Record<OperationType, string> = {
  addition: "Sumas",
  subtraction: "Restas",
  multiplication: "Multiplicaciones",
  division: "Divisiones",
}

export default function PracticePage() {
  const params = useParams()
  const type = params.type as OperationType
  const operation = operationMapping[type] || "+"
  const title = operationTitles[type] || "Práctica"

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [difficulty, setDifficulty] = useState<"fácil" | "medio" | "difícil">("fácil")
  const [answeredQuestions, setAnsweredQuestions] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const { toast } = useToast()
  const router = useRouter()
  const { user, userProgress } = useAuth()

  // Generar una nueva pregunta
  const generateQuestion = (operation: Operation) => {
    let num1, num2, correctAnswer

    const ranges = {
      fácil: { min: 1, max: 20, mult: 10 },
      medio: { min: 10, max: 50, mult: 12 },
      difícil: { min: 20, max: 100, mult: 15 },
    }

    const range = ranges[difficulty]

    switch (operation) {
      case "+":
        num1 = generateNumber(range.min, range.max)
        num2 = generateNumber(range.min, range.max)
        correctAnswer = num1 + num2
        break
      case "-":
        num1 = generateNumber(range.min + 30, range.max)
        num2 = generateNumber(range.min, num1 - 1)
        correctAnswer = num1 - num2
        break
      case "×":
        num1 = generateNumber(1, range.mult)
        num2 = generateNumber(1, range.mult)
        correctAnswer = num1 * num2
        break
      case "÷":
        num2 = generateNumber(1, range.mult)
        correctAnswer = generateNumber(1, range.mult)
        num1 = num2 * correctAnswer
        break
      default:
        num1 = generateNumber(range.min, range.max)
        num2 = generateNumber(range.min, range.max)
        correctAnswer = num1 + num2
    }

    const options = generateOptions(correctAnswer)

    setCurrentQuestion({
      num1,
      num2,
      operation,
      correctAnswer,
      options,
    })
  }

  // Generar un número aleatorio entre min y max
  const generateNumber = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  // Generar opciones para la pregunta
  const generateOptions = (correctAnswer: number) => {
    const options = [correctAnswer]

    while (options.length < 4) {
      // Generar opciones cercanas al resultado correcto
      const variation = generateNumber(1, Math.max(5, Math.floor(correctAnswer * 0.3)))

      // Añadir o restar la variación
      const option = Math.random() > 0.5 ? correctAnswer + variation : Math.max(0, correctAnswer - variation)

      if (!options.includes(option)) {
        options.push(option)
      }
    }

    return options.sort(() => Math.random() - 0.5)
  }

  // Verificar respuesta
  const checkAnswer = async (selectedAnswer: number) => {
    setAnsweredQuestions((prev) => prev + 1)

    if (currentQuestion && selectedAnswer === currentQuestion.correctAnswer) {
      // Respuesta correcta
      const pointsEarned = calculatePoints()
      setCorrectAnswers((prev) => prev + 1)
      setScore((prev) => prev + pointsEarned)
      setStreak((prev) => prev + 1)

      // Actualizar puntos en Firebase y localStorage
      if (user) {
        await updateUserPoints(user.uid, pointsEarned)
        await updateExerciseCompletion(user.uid, type)

        // Actualizar racha si es necesario
        if (streak + 1 >= 5) {
          await updateUserStreak(user.uid)
        }
      }

      toast({
        title: "¡Correcto!",
        description: `+${pointsEarned} puntos`,
        variant: "default",
      })

      if (streak + 1 >= 5) {
        // Lanzar confeti al lograr una racha de 5
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        })

        toast({
          title: "¡Racha de " + (streak + 1) + "!",
          description: "¡Sigue así!",
          variant: "default",
        })
      }

      // Generar nueva pregunta después de un breve retraso
      setTimeout(() => {
        generateQuestion(operation)
      }, 1000)
    } else {
      // Respuesta incorrecta
      setStreak(0)

      toast({
        title: "Incorrecto",
        description: `La respuesta correcta era ${currentQuestion?.correctAnswer}`,
        variant: "destructive",
      })
    }
  }

  // Calcular puntos basados en dificultad y operación (sin tiempo)
  const calculatePoints = () => {
    if (!currentQuestion) return 0

    const difficultyMultiplier = {
      fácil: 1,
      medio: 2,
      difícil: 3,
    }[difficulty]

    const operationMultiplier = {
      "+": 1,
      "-": 1.2,
      "×": 1.5,
      "÷": 2,
    }[currentQuestion.operation]

    return Math.round(10 * difficultyMultiplier * operationMultiplier)
  }

  // Generar primera pregunta al cargar
  useEffect(() => {
    generateQuestion(operation)
  }, [difficulty, operation])

  // Calcular porcentaje de aciertos
  const accuracyPercentage = answeredQuestions > 0 ? Math.round((correctAnswers / answeredQuestions) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.push("/dashboard")} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold text-green-800">{title}</h1>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 text-center">
            <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
            <p className="text-sm text-gray-500">Puntuación</p>
            <p className="text-xl font-bold">{score}</p>
          </Card>

          <Card className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <p className="text-sm text-gray-500">Racha</p>
            <p className="text-xl font-bold">{streak}</p>
          </Card>

          <Card className="p-4 text-center">
            <AlertCircle className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <p className="text-sm text-gray-500">Precisión</p>
            <p className="text-xl font-bold">{accuracyPercentage}%</p>
          </Card>
        </div>

        {/* Selector de dificultad */}
        <div className="flex justify-center mb-6 space-x-2">
          <Badge
            variant={difficulty === "fácil" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setDifficulty("fácil")}
          >
            Fácil
          </Badge>
          <Badge
            variant={difficulty === "medio" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setDifficulty("medio")}
          >
            Medio
          </Badge>
          <Badge
            variant={difficulty === "difícil" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setDifficulty("difícil")}
          >
            Difícil
          </Badge>
        </div>

        {/* Pregunta actual */}
        {currentQuestion && (
          <Card className="p-6 mb-6 shadow-lg">
            <div className="text-3xl font-bold text-center mb-6">
              {currentQuestion.num1} {currentQuestion.operation} {currentQuestion.num2} = ?
            </div>

            <div className="grid grid-cols-2 gap-4">
              {currentQuestion.options.map((option, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="lg"
                  className="text-xl py-6 hover:bg-green-100"
                  onClick={() => checkAnswer(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </Card>
        )}

        {/* Botón para saltar */}
        <div className="text-center">
          <Button variant="outline" onClick={() => generateQuestion(operation)}>
            Saltar pregunta
          </Button>
        </div>
      </div>
    </div>
  )
}
