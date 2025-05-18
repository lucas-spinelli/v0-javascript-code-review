import { Capacitor } from "@capacitor/core"
import { App } from "@capacitor/app"
import { SplashScreen } from "@capacitor/splash-screen"
import { StatusBar, Style } from "@capacitor/status-bar"
import { PushNotifications } from "@capacitor/push-notifications"

// Verificar si estamos en un entorno nativo
export const isNativePlatform = () => Capacitor.isNativePlatform()
export const isAndroid = () => Capacitor.getPlatform() === "android"
export const isIOS = () => Capacitor.getPlatform() === "ios"

// Inicializar características nativas
export const initializeNativeFeatures = async () => {
  if (!isNativePlatform()) return

  try {
    // Configurar barra de estado
    if (Capacitor.isPluginAvailable("StatusBar")) {
      await StatusBar.setStyle({ style: Style.Dark })
      await StatusBar.setBackgroundColor({ color: "#4ade80" }) // Verde
    }

    // Ocultar splash screen después de la inicialización
    if (Capacitor.isPluginAvailable("SplashScreen")) {
      await SplashScreen.hide()
    }

    // Configurar notificaciones push
    if (Capacitor.isPluginAvailable("PushNotifications")) {
      await PushNotifications.requestPermissions()
      await PushNotifications.register()
    }

    // Manejar eventos del ciclo de vida de la app
    App.addListener("appStateChange", ({ isActive }) => {
      console.log("App state changed. Is active?", isActive)
    })

    App.addListener("backButton", () => {
      console.log("Back button pressed")
    })
  } catch (error) {
    console.error("Error initializing native features:", error)
  }
}

// Abrir enlaces externos en el navegador del sistema
export const openExternalBrowser = async (url: string) => {
  if (isNativePlatform()) {
    await App.openUrl({ url })
    return true
  }
  return false
}

// Manejar autenticación en entorno nativo
export const handleNativeAuth = async (authUrl: string) => {
  if (isNativePlatform()) {
    return await openExternalBrowser(authUrl)
  }
  return false
}
