import { MessageBus } from "dbus-next"

export default async function pairNotif(busSesion: MessageBus, pairCode: string) {
  const proxy = await busSesion.getProxyObject(
    "org.freedesktop.Notifications",
    "/org/freedesktop/Notifications",
  )
  const iface = proxy.getInterface("org.freedesktop.Notifications")

  await iface.Notify("", 0, "", "Pair Request", `Code: ${pairCode}`, [], {}, -1)
}
