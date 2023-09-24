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
import { colors, typography } from "app/theme"
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text } from "react-native"
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
import ws from "app/utils/websocketsService"


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
        options={{ headerTitle: "Scan Devices", headerBackVisible: false }}
      />
      <Stack.Screen
        name="CodeConfirm"
        component={Screens.CodeConfirm}
        options={{ headerTitle: "Pair Code" }}
      />
      <Stack.Screen
        name="Player"
        component={Screens.Player}
        options={({ navigation }) => ({
          headerTitle: "Playing Now",
          headerRight: () => (
            <Menu >
              <MenuTrigger>
                <Ionicons color='black' size={25} name="menu" />
              </MenuTrigger>
              <MenuOptions optionsContainerStyle={{ borderRadius: 10 }}>
                <MenuOption onSelect={() => { ws.close(); navigation.replace('DeviceDiscovery') }}>
                  <Text style={styles.menuBtn}>Unpair</Text>
                </MenuOption>
                <MenuOption onSelect={() => { ws.emit("mediaSourceRequest") }}>
                  <Text style={styles.menuBtn}>Refresh</Text>
                </MenuOption>
              </MenuOptions>
            </Menu>
          ),
          headerBackVisible: false
        })}
      />
    </Stack.Navigator>
  )
}

export interface NavigationProps
  extends Partial<React.ComponentProps<typeof NavigationContainer>> { }

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

const styles = StyleSheet.create({
  menuBtn: {
    color: colors.palette.neutral900,
    fontFamily: typography.primary.semiBold,
    fontWeight: "500",
    marginLeft: 4,
    paddingVertical: 6
  }
})
