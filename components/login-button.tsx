"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface LoginButtonProps {
  className?: string
  children?: React.ReactNode
  size?: "default" | "sm" | "lg" | "icon"
}

const LoginButton: React.FC<LoginButtonProps> = ({ className, children, size }) => {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    setIsLoading(true)
    // await signIn();
    setIsLoading(false)
  }

  const handleLogout = async () => {
    setIsLoading(true)
    // await signOut();
    setIsLoading(false)
  }

  return (
    <Button
      onClick={handleLogin}
      className={`bg-green-600 hover:bg-green-700 ${className}`}
      disabled={isLoading}
      size={size}
    >
      {isLoading ? "Logging in..." : "Login"}
      {children}
    </Button>
  )
}

export default LoginButton

export { LoginButton }
