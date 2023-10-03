import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { RootStackParamList } from "app/types"
import {
  KeyboardAvoidingView,
  Text,
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native"
import { useEffect, useMemo, useRef, useState } from "react"
import OTPTextInput from "react-native-otp-textinput"
import { colors, typography } from "app/theme"
import Device from "expo-device"
import { randomString } from "server/src/util/randomString"
import * as SecureStore from "expo-secure-store"

type ScreenProps = NativeStackScreenProps<RootStackParamList, "CodeConfirm">

const CodeConfirmScreen = ({ route, navigation }: ScreenProps) => {
  const server = route.params.targetDevice

  const otpInputRef = useRef<OTPTextInput>(null)
  const [loading, setLoading] = useState(true)

  const deviceId = useMemo(() => `${Device?.deviceName || "Device"}#${randomString(4)}`, [])

  const handleToken = async (token: string) => {
    return fetch(`https://${server.address}:8765/session`, {
      headers: {
        X_TOKEN: token,
      },
    })
      .then((res) => {
        return res.json()
      })
      .then((data) => {
        if (data.error) {
          if (data.message === "JWT token has expired") {
            requestPairCode()
          } else {
            throw Error()
          }
        } else {
          navigation.replace("Player", {
            targetDevice: route.params.targetDevice,
            sessionId: data.sessionId,
          })
        }
      })
      .catch(() => {
        Alert.alert("Oops!", "Something went wrong. Please try again. 😊")
        navigation.replace("DeviceDiscovery")
      })
  }

  const requestPairCode = async () => {
    await fetch(`https://${server.address}:8765/pair-request`, {
      method: "POST",
      headers: {
        "application-type": "application/json",
      },
      body: JSON.stringify({ device: deviceId }),
    })
      .then((res) => {
        if (!res.ok) throw Error()
      })
      .catch(() => {
        Alert.alert("Oops!", "Something went wrong. Please try again. 😊")
        navigation.replace("DeviceDiscovery")
      })
  }

  useEffect(() => {
    ;(async () => {
      const token = await SecureStore.getItemAsync("token")
      if (token) {
        await handleToken(token)
      } else {
        await requestPairCode()
      }
      setLoading(false)
    })()
  }, [])

  const handleOtpChange = async (code: string) => {
    if (code.length === 5) {
      setLoading(true)
      await fetch(`https://${server.address}:8765/pair`, {
        method: "POST",
        headers: {
          "application-type": "application/json",
        },
        body: JSON.stringify({ pair_code: code, device: deviceId }),
      })
        .then((res) => {
          if (res.status === 401) {
            throw Error("Wrong code")
          } else if (!res.ok) {
            throw Error()
          } else {
            return res.json()
          }
        })
        .then(async (data) => {
          await SecureStore.setItemAsync("token", data.token)
          navigation.replace("Player", {
            targetDevice: route.params.targetDevice,
            sessionId: data.sessionId,
          })
        })
        .catch((e) => {
          if (e.message === "Invalid pair code.") {
            Alert.alert("Oops!", "Wrong code. Please try again. 😊")
          } else {
            Alert.alert("Oops!", "Something went wrong. Please try again. 😊")
            navigation.replace("DeviceDiscovery")
          }
        })
      otpInputRef.current?.clear()
      setLoading(false)
    }
  }

  if (loading)
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.palette.primary500} />
      </View>
    )

  return (
    <KeyboardAvoidingView behavior={"height"} style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.targetDevice}>{server.name}</Text>
        <Text style={styles.secondaryText}>
          Enter the 5-digit PAIR code that has been sent to your device to continue
        </Text>
      </View>
      <View style={styles.optContainer}>
        <OTPTextInput
          ref={otpInputRef}
          inputCount={5}
          autoFocus={true}
          keyboardType="number-pad"
          handleTextChange={handleOtpChange}
          tintColor={colors.palette.neutral400}
        />
      </View>
      <View style={styles.footerTextContaiter}>
        <Text style={styles.secondaryText}>Haven't got the pair code yet? </Text>
        <Pressable onPress={requestPairCode}>
          <Text style={styles.resend}>Resend</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  footerTextContaiter: {
    alignItems: "center",
    display: "flex",
    marginTop: 8,
  },
  loading: {
    paddingTop: 16,
  },
  optContainer: {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
  },
  resend: {
    color: colors.palette.primary500,
    fontFamily: typography.primary.medium,
  },
  secondaryText: {
    color: colors.text,
    fontFamily: typography.primary.medium,
    textAlign: "center",
  },
  targetDevice: {
    color: colors.text,
    fontFamily: typography.primary.medium,
    fontSize: 26,
    fontWeight: "500",
    marginBottom: 6,
    textAlign: "center",
  },
  textContainer: {
    paddingVertical: 32,
  },
})

export default CodeConfirmScreen
