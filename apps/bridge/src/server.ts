import { getCurrentMediaApp } from "./mpris/mpris"
import { WebSocketServer, WebSocket } from "ws"
import dbus from "dbus-next"
import pairNotif from "./notif"
import { randomNumberString, randomString } from "./util/randomString"
import { getComputerName } from "./util/getComputerName"
import listenForDiscoveryMsg from "./discover"
import { createWsEvent, isValidEventData } from "./util/ws"
import { AllPropsInType } from "./mpris/Player"

type CustomWs = WebSocket & {
  id: string
  isAlive: boolean
  authorized?: boolean
  pair_code?: string
}

type WsEvents = Record<string, (ws: CustomWs, payload?: unknown) => void>

  ; (async function () {
    const busSession = dbus.sessionBus()
    const hostname = getComputerName()


    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    BigInt.prototype.toJSON = function () {
      return this.toString()
    }

    const { player, onUpdate, onChange } = await getCurrentMediaApp(busSession)
    console.log("Media Player Handler loaded")

    listenForDiscoveryMsg(hostname)

    //register events
    const wsEvents: WsEvents = {
      pairRequest: handlePairRequestEvent,
      pairCodeVerification: handlePairEvent,
      mediaSourceRequest: handleMediaRequestEvent,
      updateMedia: handleUpdateMediaEvent,
      nextMedia: handleNextMediaEvent,
      prevMedia: handlePrevMediaEvent,
      pauseMedia: handlePauseMediaEvent,
      playMedia: handlePlayMediaEvent,
      mediaPositionRequest: handleMediaPositionRequest,
      mediaSeek: handleMediaSeek,
    }

    const wss = new WebSocketServer({ port: 8765 })

    wss.on("connection", (ws: CustomWs) => {
      ws.isAlive = true
      ws.id = randomString(10)

      console.log("connected")

      setTimeout(() => {
        if (!ws.authorized) {
          ws.terminate()
        }
      }, 600000)

      onUpdate((data) => ws.authorized && ws.send(createWsEvent("mediaUpdated", data)))
      onChange(
        async (player) =>
          ws.authorized && ws.send(createWsEvent("mediaSourceChanged", await player?.getAllProps())),
      )

      ws.on("error", () => console.error)

      ws.on("message", async (data) => {
        try {
          const jsonData = (await JSON.parse(data.toString())) as { event: string; payload?: unknown }
          if (isValidEventData(jsonData)) {
            if (!wsEvents[jsonData.event]) return
            wsEvents[jsonData.event](ws, jsonData.payload)
          }
        } catch (error) {
          return
        }
      })

      ws.on("pong", function heartbeat() {
        ws.isAlive = true
      })

      ws.on("close", () => {
        console.log(ws.id + " closed")
      })
    })

    const interval = setInterval(function ping() {
      const clients = wss.clients as Set<CustomWs>
      clients.forEach((ws) => {
        if (ws.isAlive === false) {
          console.log("ws terminated")
          return ws.terminate()
        }

        ws.isAlive = false
        ws.ping()
      })
    }, 10000)

    wss.on("close", function close() {
      console.log("close")
      clearInterval(interval)
    })

    wss.on("error", function close() {
      console.log("error")
      clearInterval(interval)
    })

    async function handlePairRequestEvent(ws: CustomWs) {
      const randomCode = randomNumberString(5)
      ws.pair_code = randomCode
      await pairNotif(busSession, randomCode)
    }

    function handlePairEvent(ws: CustomWs, payload?: unknown) {
      if (
        payload &&
        typeof payload === "object" &&
        "pair_code" in payload &&
        typeof payload.pair_code === "string"
      ) {
        if (payload.pair_code === ws.pair_code) {
          ws.authorized = true
          ws.send(createWsEvent("pairCodeVerified"))
        } else {
          ws.send(createWsEvent("pairCodeIncorrect"))
        }
      } else {
        ws.send(createWsEvent("PairingFailure"))
      }
    }

    async function handleMediaRequestEvent(ws: CustomWs) {
      const data = await player?.getAllProps()
      if (ws.authorized) ws.send(createWsEvent("mediaSourceChanged", data))
    }

    function handleUpdateMediaEvent(ws: CustomWs, payload: unknown) {
      if (ws.authorized && payload && typeof payload === "object") {
        player?.updateFields(payload as Partial<AllPropsInType>)
      }
    }

    function handleNextMediaEvent(ws: CustomWs) {
      if (ws.authorized) {
        player?.next()
      }
    }

    function handlePrevMediaEvent(ws: CustomWs) {
      if (ws.authorized) {
        player?.prev()
      }
    }

    function handlePlayMediaEvent(ws: CustomWs) {
      if (ws.authorized) {
        player?.play()
      }
    }

    function handlePauseMediaEvent(ws: CustomWs) {
      if (ws.authorized) {
        player?.pause()
      }
    }

    async function handleMediaPositionRequest(ws: CustomWs) {
      if (ws.authorized) {
        ws.send(createWsEvent("mediaPositionResponse", await player?.position))
      }
    }

    async function handleMediaSeek(ws: CustomWs, payload: unknown) {
      if (ws.authorized && payload && typeof payload === "object" && "position" in payload && "id" in payload) {
        await player?.setPostition(payload as { id: string, position: string })
      }
    }
  })()
