import React, { useCallback, useEffect, useState } from "react"
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack"
import type { Device, RootStackParamList } from "../types"
import { colors, typography } from "app/theme"
import dgram from "react-native-udp"

type ItemProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "DeviceDiscovery", undefined>
  data: Device
}

const Item = ({ navigation, data }: ItemProps) => {
  return (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate("CodeConfirm", { targetDevice: data })}
    >
      <View style={styles.iconContainer}>
        <MaterialIcons name="desktop-mac" size={24} color={"#6C6C6C"} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{data.name}</Text>
        <Text style={styles.addr}>{data.address}</Text>
      </View>
      <View>
        <MaterialIcons name="arrow-forward" size={24} color={colors.palette.primary500} />
      </View>
    </TouchableOpacity>
  )
}

type ScreenProps = NativeStackScreenProps<RootStackParamList, "DeviceDiscovery">

const udpClient = dgram.createSocket({ type: "udp4" })
udpClient.bind(60536)

const DeviceDiscoveryScreen = ({ navigation }: ScreenProps) => {
  const [devices, setDevices] = useState<Device[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const refreshDevices = useCallback(() => {
    setRefreshing(true)
    setDevices([])
    const discoveryMessage = "DiscoverDevices_15dsa15s8"
    udpClient.send(discoveryMessage, 0, discoveryMessage.length, 60537, "255.255.255.255")
    setTimeout(() => {
      setRefreshing(false)
    }, 2000)
  }, [])

  useEffect(() => {
    udpClient.on("message", (msg, rinfo) => {
      const deviceInfo = JSON.parse(msg.toString())
      if (!devices.find((device) => device.address === rinfo.address)) {
        setDevices([...devices, { name: deviceInfo.name, address: rinfo.address }])
      }
    })
    refreshDevices()
  }, [])

  return (
    <View style={styles.container}>
      <FlatList
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshDevices} />}
        data={devices}
        keyExtractor={(item) => item.address}
        renderItem={(item) => <Item navigation={navigation} data={item.item} />}
        contentContainerStyle={styles.list}
      />
      <Pressable style={styles.scanBtn} onPress={refreshDevices}>
        <Text style={styles.scanBtnText}>Scan </Text>
        <MaterialIcons name="refresh" size={22} color={colors.palette.neutral100} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  addr: {
    color: colors.textDim,
    fontFamily: typography.primary.medium,
    fontSize: 12,
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
    fontFamily: typography.primary.medium,
  },
  iconContainer: {
    marginRight: 14,
  },
  item: {
    alignItems: "center",
    backgroundColor: colors.palette.neutral100,
    borderRadius: 10,
    display: "flex",
    elevation: 1,
    flexDirection: "row",
    marginBottom: 6,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  list: {
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  scanBtn: {
    alignItems: "center",
    backgroundColor: colors.palette.primary500,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 16,
  },
  scanBtnText: {
    color: colors.palette.neutral100,
    fontFamily: typography.primary.semiBold,
    fontWeight: "500",
    textAlign: "center",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontFamily: typography.primary.semiBold,
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
})

export default DeviceDiscoveryScreen
