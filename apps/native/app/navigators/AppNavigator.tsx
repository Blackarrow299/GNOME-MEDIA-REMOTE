import {
  // DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native"
import { createNativeStackNavigator, NativeStackScreenProps } from "@react-navigation/native-stack"
import React from "react"
// import { useColorScheme } from "react-native"
import * as Screens from "app/screens"
// import { colors } from "app/theme"
import BootSplash from "react-native-bootsplash"
import { RootStackParamList } from "app/types"
import { typography } from "app/theme"

export type AppStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>

const Stack = createNativeStackNavigator<RootStackParamList>()

const AppStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="DeviceDiscovery"
      screenOptions={{
        headerTitleAlign: "center",
        headerTitleStyle: { fontFamily: typography.primary.semiBold, fontSize: 16 },
      }}
    >
      <Stack.Screen
        name="DeviceDiscovery"
        component={Screens.DeviceDiscovery}
        options={{ headerTitle: "Scan Devices" }}
      />
      <Stack.Screen
        name="CodeConfirm"
        component={Screens.CodeConfirm}
        options={{ headerTitle: "Pair Code" }}
      />
      <Stack.Screen name="Player" component={Screens.Player} options={{ headerTitle: "Player" }} />
    </Stack.Navigator>
  )
}

export interface NavigationProps
  extends Partial<React.ComponentProps<typeof NavigationContainer>> {}

export const AppNavigator = (props: NavigationProps) => {
  // const colorScheme = useColorScheme()

  return (
    <NavigationContainer
      onReady={() => {
        BootSplash.hide()
      }}
      theme={DefaultTheme}
      {...props}
    >
      <AppStack />
    </NavigationContainer>
  )
}
