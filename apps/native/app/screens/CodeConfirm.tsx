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
import { useEffect, useRef, useState } from "react"
import OTPTextInput from "react-native-otp-textinput"
import { colors, typography } from "app/theme"
import ws from "app/utils/websocketsService"
type ScreenProps = NativeStackScreenProps<RootStackParamList, "CodeConfirm">

const CodeConfirmScreen = ({ route, navigation }: ScreenProps) => {
  const server = route.params.targetDevice

  const otpInputRef = useRef<OTPTextInput>(null)

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  // const deviceId = useMemo(() => `${Device.deviceName}#${randomString(4)}`, [])

  const requestPairCode = () => {
    ws.emit("pairRequest")
  }

  useEffect(() => {
    if (ws._ws) setLoading(false)
    ws.connect(`ws://${server.address}:8765`)

    ws.on("open", () => {
      setLoading(false)
      requestPairCode()
    })

    ws.on("pairCodeVerified", () => {
      navigation.replace("Player")
    })

    ws.on("pairCodeIncorrect", () => {
      Alert.alert("Oops!", "Wrong code. Please try again. 😊")
      otpInputRef.current?.clear()
      setLoading(false)
    })

    ws.on("PairingFailure", () => {
      Alert.alert("Oops!", "Something went wrong. Please try again. 😊")
      otpInputRef.current?.clear()
      setLoading(false)
    })

    ws.on("error", () => {
      setError("websocket error")
      setLoading(false)
    })

    ws.on("close", () => {
      Alert.alert("Oops!", "Connection lost.")
      // connection closed
      navigation.replace("DeviceDiscovery")
    })

    return () => ws.removeAllListeners()
  }, [])

  if (loading)
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.palette.primary500} />
      </View>
    )

  if (error && !loading)
    return (
      <View>
        <Text>error</Text>
      </View>
    )

  const handleOtpChange = (code: string) => {
    if (code.length === 5) {
      setLoading(true)
      ws.emit("pairCodeVerification", { pair_code: code })
    }
  }

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
