"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Home, Calculator, Award, User, LogOut } from "lucide-react"
import Image from "next/image"

export function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, signOut, userProgress } = useAuth()

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const navItems = [
    { name: "Inicio", href: "/dashboard", icon: <Home className="h-5 w-5" /> },
    { name: "Práctica", href: "/practice/addition", icon: <Calculator className="h-5 w-5" /> },
    { name: "Logros", href: "/achievements", icon: <Award className="h-5 w-5" /> },
    { name: "Perfil", href: "/profile", icon: <User className="h-5 w-5" /> },
  ]

  if (!user) return null

  return (
    <>
      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full ${
                pathname === item.href ? "text-green-600" : "text-gray-500"
              }`}
              onClick={closeMenu}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 flex-col z-50">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <Calculator className="h-8 w-8 text-green-600 mr-2" />
            <h1 className="text-xl font-bold text-green-600">LuckMaths</h1>
          </div>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            {user.photoURL ? (
              <Image
                src={user.photoURL || "/placeholder.svg"}
                alt={user.displayName || "Usuario"}
                width={40}
                height={40}
                className="rounded-full mr-3"
              />
            ) : (
              <div className="bg-green-100 p-2 rounded-full mr-3">
                <User className="h-5 w-5 text-green-600" />
              </div>
            )}
            <div>
              <p className="font-medium">{user.displayName || "Usuario"}</p>
              <p className="text-xs text-gray-500">{userProgress?.points || 0} XP</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto py-4">
          <nav className="space-y-1 px-2">
            {navItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-md ${
                  pathname === item.href ? "bg-green-100 text-green-600" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-200">
          <Button variant="outline" className="w-full justify-start" onClick={signOut}>
            <LogOut className="h-5 w-5 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </>
  )
}
