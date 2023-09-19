import { Message, MessageType } from "dbus-next"
export default function isMediaPlayerSignal(msg: Message) {
  if (msg.type === MessageType.SIGNAL && msg.path === "/org/mpris/MediaPlayer2") {
    return true
  }
  return false
}
