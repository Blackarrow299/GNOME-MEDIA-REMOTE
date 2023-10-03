import { MessageBus, Variant } from "dbus-next"
import { Message } from "dbus-next"
import { MetadataRaw, parseMetadata } from "../util/metadata"

export type PlaybackStatus = "Paused" | "Playing" | "Stopped"
export type LoopStatus = "None" | "Track" | "Playlist"

export type AllPropsOutType = {
  PlaybackStatus: PlaybackStatus
  LoopStatus: LoopStatus
  Rate: number
  Shuffle: boolean
  Metadata: Awaited<ReturnType<typeof parseMetadata>>
  Volume: number
  Position: string
  MinimumRate?: number
  MaximumRate?: number
  CanGoNext: boolean
  CanGoPrevious: boolean
  CanPlay: boolean
  CanPause: boolean
  CanSeek: boolean
  CanControl: boolean
}

export type AllPropsInType = {
  LoopStatus: LoopStatus
  Rate: number
  Shuffle: boolean
  Volume: number
  // Position: bigint :: use Seek() function instead
}

export default class MediaPlayer {
  public name: string
  private _bus: MessageBus
  public owner: string

  constructor(bus: MessageBus, dest: string, owner: string) {
    this.name = dest
    this._bus = bus
    this.owner = owner
    this.addPropChangeMatch()
    this.addSeekMatch()
  }

  get metadata() {
    return parseMetadata(this.getProp("Metadata") as MetadataRaw)
  }

  get playbackStatus(): Promise<PlaybackStatus | undefined> {
    return this.getProp("PlaybackStatus")
  }

  get rate(): Promise<number | undefined> {
    return this.getProp("Rate")
  }

  get loopStatus(): Promise<LoopStatus | undefined> {
    return this.getProp("LoopStatus")
  }

  set loopStatus(value: LoopStatus) {
    this.setProp("LoopStatus", new Variant("s", value))
  }

  get shuffle(): Promise<boolean | undefined> {
    return this.getProp("Shuffle")
  }

  set shuffle(value: boolean) {
    this.setProp("Shuffle", new Variant("b", value))
  }

  get volume(): Promise<number | undefined> {
    return this.getProp("Volume")
  }

  set volume(value: number) {
    this.setProp("Volume", new Variant("d", +value))
  }

  get position(): Promise<string | undefined> {
    return this.getProp("Position").then((v: bigint | undefined) => v?.toString())
  }

  get minimumRate(): Promise<number | undefined> {
    return this.getProp("MinimumRate")
  }

  get maximumRate(): Promise<number | undefined> {
    return this.getProp("MaximumRate")
  }

  get canGoNext(): Promise<boolean | undefined> {
    return this.getProp("CanGoNext")
  }

  get canGoPrevious(): Promise<boolean | undefined> {
    return this.getProp("CanGoPrevious")
  }

  get canPlay(): Promise<boolean | undefined> {
    return this.getProp("CanPlay")
  }

  get canPause(): Promise<boolean | undefined> {
    return this.getProp("CanPause")
  }

  get canSeek(): Promise<boolean | undefined> {
    return this.getProp("CanSeek")
  }

  get canControl(): Promise<boolean | undefined> {
    return this.getProp("CanControl")
  }

  updateField<T extends keyof AllPropsInType>(propName: T, value: AllPropsInType[T]) {
    const field = propName.charAt(0).toLowerCase() + propName.slice(1)
    if (field in this) {
      ;(this as any)[field] = value
    } else {
      console.log(`Field '${field}' does not exist in class Player.`)
    }
  }

  updateFields(fields: Partial<AllPropsInType>) {
    let fieldName: keyof AllPropsInType
    for (fieldName in fields) {
      this.updateField(fieldName, fields[fieldName]!)
    }
  }

  play() {
    this.callFunc("Play")
  }

  pause() {
    this.callFunc("Pause")
  }

  next() {
    this.callFunc("Next")
  }

  prev() {
    this.callFunc("Previous")
  }

  setPostition(args: { id: string; position: string }) {
    this.callFunc("SetPosition", "ox", [args.id, args.position])
  }

  addPropChangeMatch() {
    this._bus.send(
      new Message({
        path: "/org/freedesktop/DBus",
        destination: "org.freedesktop.DBus",
        interface: "org.freedesktop.DBus",
        member: "AddMatch",
        signature: "s",
        body: [
          "type='signal',sender='" +
            this.name +
            "',interface='org.freedesktop.DBus.Properties',member='PropertiesChanged'",
        ],
      }),
    )
  }

  addSeekMatch() {
    this._bus.send(
      new Message({
        path: "/org/freedesktop/DBus",
        destination: "org.freedesktop.DBus",
        interface: "org.freedesktop.DBus",
        member: "AddMatch",
        signature: "s",
        body: [
          "type='signal',sender='" +
            this.name +
            "',interface='org.mpris.MediaPlayer2.Player',member='Seeked'",
        ],
      }),
    )
  }

  removeAllMatches() {
    this._bus.send(
      new Message({
        path: "/org/freedesktop/DBus",
        destination: "org.freedesktop.DBus",
        interface: "org.freedesktop.DBus",
        member: "RemoveMatch",
        signature: "s",
        body: [
          "type='signal',sender='" +
            this.name +
            "',interface='org.freedesktop.DBus.Properties',member='PropertiesChanged'",
        ],
      }),
    )
    this._bus.send(
      new Message({
        path: "/org/freedesktop/DBus",
        destination: "org.freedesktop.DBus",
        interface: "org.freedesktop.DBus",
        member: "RemoveMatch",
        signature: "s",
        body: [
          "type='signal',sender='" +
            this.name +
            "',interface='org.mpris.MediaPlayer2.Player',member='Seeked'",
        ],
      }),
    )
  }

  callFunc(func: string, signature?: string, body?: any[]) {
    this._bus.send(
      new Message({
        destination: this.name,
        path: "/org/mpris/MediaPlayer2",
        interface: "org.mpris.MediaPlayer2.Player",
        member: func,
        body,
        signature,
      }),
    )
  }

  async getProp(prop: string) {
    try {
      const methodCall = new Message({
        destination: this.name,
        path: "/org/mpris/MediaPlayer2",
        interface: "org.freedesktop.DBus.Properties",
        member: "Get",
        body: ["org.mpris.MediaPlayer2.Player", prop],
        signature: "ss",
      })
      const reply = await this._bus.call(methodCall)
      return (reply?.body[0] as Variant).value
    } catch {
      return undefined
    }
  }

  setProp(prop: string, value: Variant<any>) {
    const methodCall = new Message({
      destination: this.name,
      path: "/org/mpris/MediaPlayer2",
      interface: "org.freedesktop.DBus.Properties",
      member: "Set",
      body: ["org.mpris.MediaPlayer2.Player", prop, value],
      signature: "ssv",
    })
    this._bus.send(methodCall)
  }

  async getAllProps(): Promise<Partial<AllPropsOutType>> {
    const data = {
      PlaybackStatus: await this.playbackStatus,
      LoopStatus: await this.loopStatus,
      Rate: await this.rate,
      Shuffle: await this.shuffle,
      Volume: await this.volume,
      Position: await this.position,
      MinimumRate: await this.minimumRate,
      MaximumRate: await this.maximumRate,
      CanGoNext: await this.canGoNext,
      CanGoPrevious: await this.canGoPrevious,
      CanPlay: await this.canPlay,
      CanPause: await this.canPause,
      CanSeek: await this.canSeek,
      CanControl: await this.canControl,
      Metadata: await this.metadata,
    }

    return data
  }
}
