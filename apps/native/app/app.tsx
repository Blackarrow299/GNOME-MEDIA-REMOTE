import "./utils/ignoreWarnings"
import { useFonts } from "expo-font"
import React from "react"
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context"
import { AppNavigator } from "./navigators"
import { customFontsToLoad } from "./theme"

export const NAVIGATION_PERSISTENCE_KEY = "NAVIGATION_STATE"

function App() {
  const [areFontsLoaded] = useFonts(customFontsToLoad)

  if (!areFontsLoaded) return null

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AppNavigator />
    </SafeAreaProvider>
  )
}

export default App
