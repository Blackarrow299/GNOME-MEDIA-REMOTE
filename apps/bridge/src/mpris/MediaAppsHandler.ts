import MediaPlayer from "./Player"
import dbus from "dbus-next"

export default class MediaAppsHandler {
  private _bus
  private _mediaAppsList: MediaPlayer[] | undefined
  private _onCloseSubs: ((owner: string) => void)[]
  private _onChangeSubs: (() => void)[]

  constructor(bus: dbus.MessageBus, onLoad: () => void) {
    this._bus = bus
    this._onCloseSubs = []
    this._onChangeSubs = []
    this.getMediaAppsNames().then(() => onLoad())
  }

  get players() {
    return this._mediaAppsList || this.getMediaAppsNames()
  }

  private async getMediaAppsNames() {
    const proxy = await this._bus.getProxyObject("org.freedesktop.DBus", "/org/freedesktop/DBus")
    const iface = proxy.getInterface("org.freedesktop.DBus")
    const mediaList: MediaPlayer[] = []

    const namesList = (await iface.ListNames()) as string[]
    for (const name of namesList) {
      if (name.startsWith("org.mpris.MediaPlayer2")) {
        const owner = await iface.GetNameOwner(name)
        mediaList.push(new MediaPlayer(this._bus, name, owner))
      }
    }
    this._mediaAppsList = mediaList

    iface.on("NameOwnerChanged", (iface, changed, invalidated) => {
      if ((iface as string).startsWith("org.mpris.MediaPlayer2.")) {
        if (changed) {
          //closed
          this._mediaAppsList = this._mediaAppsList?.filter((media) => {
            if (media.name != iface) {
              return true
            }
            media.removeAllMatches()
            return false
          })
          this._onCloseSubs.forEach((fn) => fn(changed))
        } else {
          //opened
          this._mediaAppsList?.push(new MediaPlayer(this._bus, iface, invalidated))
        }
        this._onChangeSubs.forEach((fn) => fn())
      }
    })
    return this._mediaAppsList
  }

  async getPlayingMediaApp(): Promise<{ player: MediaPlayer | null; paused: boolean }> {
    let mediaPlayerOut = null
    const mediaList = await this.players
    for (const mediaPlayer of mediaList) {
      const playbackStatus = await mediaPlayer.playbackStatus

      //this code gives priority to the media player with Playing status
      if (playbackStatus === "Paused") {
        mediaPlayerOut = mediaPlayer
      }
      if (playbackStatus === "Playing") {
        //paused is just to give the value without calling dbus for PlaybackStatus
        return { player: mediaPlayer, paused: false }
      }
    }
    return { player: mediaPlayerOut, paused: true }
  }

  onCLose(func: (owner: string) => void) {
    this._onCloseSubs.push(func)
  }

  onChange(func: () => void) {
    this._onChangeSubs.push(func)
  }
}
