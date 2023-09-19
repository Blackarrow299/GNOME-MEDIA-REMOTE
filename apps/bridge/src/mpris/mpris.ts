import { MessageBus, Variant } from "dbus-next"
import type { AllPropsOutType } from "./Player"
import { parseMetadata } from "../util/metadata"
import MediaAppsHandler from "./MediaAppsHandler"
import isMediaPlayerSignal from "../util/isMediaPropSignal"
import MediaPlayer from "./Player"

export async function getCurrentMediaApp(busSession: MessageBus) {
  const mediaAppsHandler = new MediaAppsHandler(busSession, async () => null)
  let currentMedia = await mediaAppsHandler.getPlayingMediaApp()
  const onUpdateSub: ((data: Partial<AllPropsOutType>) => void)[] = []
  const onChangeSub: ((player: MediaPlayer | null) => void)[] = []

  mediaAppsHandler.onChange(async () => {
    const currentMediOwnerTmp = currentMedia.player?.owner
    currentMedia = await mediaAppsHandler.getPlayingMediaApp()

    if (!currentMedia.player) onUpdateSub.forEach((fn) => fn({}))
    else if (currentMediOwnerTmp !== currentMedia.player.owner) {
      onChangeSub.forEach((fn) => fn(currentMedia.player))
    }
  })

  busSession.on("message", async (msg) => {
    if (isMediaPlayerSignal(msg)) {
      // console.log(msg);
      if (msg.member == "Seeked") {
        onUpdateSub.forEach((fn) => fn({ Position: msg.body[0] }))
      } else if (msg.member === "PropertiesChanged") {
        const playerOwnerTmp = currentMedia.player?.owner
        const prop = msg.body[1]
        if (prop["PlaybackStatus"]) {
          const playbackStatusVar = prop["PlaybackStatus"]

          //avoid switching current media player if its just paused,if not get the new media player
          const newMedia = await mediaAppsHandler.getPlayingMediaApp()
          if (playbackStatusVar.value === "Paused" && newMedia.paused) {
            // if (newMedia.paused) return
          } else {
            currentMedia = newMedia
          }
        }
        //check if something changed
        if (currentMedia.player?.owner !== playerOwnerTmp) {
          onChangeSub.forEach((fn) => fn(currentMedia.player))
        } else if (msg.sender === playerOwnerTmp) {
          const key = Object.keys(prop)[0] as keyof AllPropsOutType
          let value = (prop[key] as Variant).value
          if (prop["Metadata"]) {
            value = await parseMetadata(value)
          }
          onUpdateSub.forEach((fn) => fn({ [key]: value } as Partial<AllPropsOutType>))
        }
      }
    }
  })

  function onUpdate(fn: (data: Partial<AllPropsOutType>) => void) {
    onUpdateSub.push(fn)
  }

  function onChange(fn: (player: MediaPlayer | null) => void) {
    onChangeSub.push(fn)
  }

  return { player: currentMedia.player, onUpdate, onChange }
}
