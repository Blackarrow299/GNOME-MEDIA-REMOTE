export type Device = {
  name: string
  address: string
}

export type RootStackParamList = {
  Welcome: undefined
  DeviceDiscovery: undefined
  CodeConfirm: { targetDevice: Device }
  Player: undefined
}
