import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.luckmaths.app",
  appName: "LuckMaths",
  webDir: "out",
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#f0fdf4",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
    },
  },
  server: {
    androidScheme: "https",
  },
}

export default config
