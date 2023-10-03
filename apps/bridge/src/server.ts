import { getCurrentMediaApp } from "./mpris/mpris"
import { WebSocketServer, WebSocket } from "ws"
import dbus from "dbus-next"
import pairNotif from "./notif"
import { randomNumberString } from "./util/randomString"
import { getComputerName } from "./util/getComputerName"
import listenForDiscoveryMsg from "./discover"
import { createWsEvent, isValidEventData } from "./util/ws"
import { AllPropsInType } from "./mpris/Player"
import { createServer as createHttpsServer } from "https"
import { readFileSync } from "fs"
import jwt from "jsonwebtoken"
import { IncomingMessage, ServerResponse } from "http"
import crypto from "crypto"

type CustomWs = WebSocket & {
  isAlive: boolean
  authorized?: boolean
  address?: string
}

type WsEvents = Record<string, (ws: CustomWs, payload?: unknown) => void>
;(async function () {
  const busSession = dbus.sessionBus()
  const hostname = getComputerName()
  const pairRequests: Record<string, string> = {}

  type Device = { address: string | undefined; name: string; created_at: Date }
  const sessions: Record<string, Device> = {}

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  BigInt.prototype.toJSON = function () {
    return this.toString()
  }

  const { player, onUpdate, onChange } = await getCurrentMediaApp(busSession)
  console.log("Media Player Handler loaded")

  listenForDiscoveryMsg(hostname)

  const privateKey = readFileSync("./cert/key.pem")
  const cert = readFileSync("./cert/cert.pem")
  const httpsServer = createHttpsServer(
    {
      cert: cert,
      key: privateKey,
    },
    handleHttpsRequests,
  )

  async function handleHttpsRequests(req: IncomingMessage, res: ServerResponse<IncomingMessage>) {
    if (req.url === "/pair-request" && req.method === "POST") {
      try {
        let rawData = ""
        req.on("data", (chunk) => {
          rawData += chunk
        })

        req.on("end", async () => {
          const data = await JSON.parse(rawData)
          if (!data["device"]) {
            res.writeHead(400)
            res.end(
              JSON.stringify({
                error: "Bad Request",
                message: "The request is invalid or missing required parameters.",
              }),
            )
            return
          }

          const randomCode = randomNumberString(5)
          await pairNotif(busSession, randomCode)

          pairRequests[data["device"]] = randomCode

          res.writeHead(200)
          res.end()
        })
      } catch (e) {
        console.log(e)
        res.writeHead(500)
        res.end(
          JSON.stringify({
            error: "Internal Server Error",
            message: "An unexpected error occurred on the server.",
          }),
        )
      }
    } else if (req.url === "/pair" && req.method === "POST") {
      let rawData = ""
      req.on("data", (chunk) => {
        rawData += chunk
      })

      req.on("end", async () => {
        try {
          const data = await JSON.parse(rawData)
          if (!data["pair_code"] || !data["device"]) {
            res.writeHead(400)
            res.end(
              JSON.stringify({
                error: "Bad Request",
                message: "The request is invalid or missing required parameters.",
              }),
            )
            return
          }

          if (pairRequests[data["device"]] !== data["pair_code"]) {
            res.writeHead(400)
            res.end(
              JSON.stringify({
                error: "Bad Request",
                message: "Invalid pair code.",
              }),
            )
            return
          }

          const token = jwt.sign({ device: data["device"] }, privateKey, {
            algorithm: "RS256",
            expiresIn: "7d",
          })

          delete pairRequests[data["device"]]
          const sessionId = createSession(data["device"], req.socket.remoteAddress || "")

          res.writeHead(200)
          res.end(JSON.stringify({ token, sessionId }))
        } catch (e) {
          res.writeHead(500)
          res.end(
            JSON.stringify({
              error: "Internal Server Error",
              message: "An unexpected error occurred on the server.",
            }),
          )
        }
      })
    } else if (req.url === "/session" && req.method === "GET") {
      const token = req.headers.x_token as string

      if (token) {
        jwt.verify(token, cert, function (err, decoded) {
          if (err?.name === "TokenExpiredError") {
            res.writeHead(401)
            res.end(
              JSON.stringify({
                error: "Unauthorized",
                message: "JWT token has expired",
              }),
            )
            return
          } else if (!err) {
            if (!req.socket.remoteAddress) throw Error()
            const deviceName = (decoded as { device: string } | undefined)?.device || ""
            const sessionId = createSession(deviceName, req.socket.remoteAddress)
            res.writeHead(200)
            res.end(JSON.stringify({ sessionId }))
            return
          }
        })
      } else {
        res.writeHead(400)
        res.end(
          JSON.stringify({
            error: "Bad Request",
            message: "Missing required header: X_TOKEN",
          }),
        )
      }
    } else {
      res.writeHead(404)
      res.end(
        JSON.stringify({
          error: "Not Found",
          message: "The requested resource was not found on the server.",
        }),
      )
    }
  }

  function createSession(name: string, address: string) {
    const sessionId = crypto.randomBytes(16).toString("hex")
    sessions[sessionId] = {
      address: address,
      name: name,
      created_at: new Date(),
    }
    return sessionId
  }

  function isSessionValid(session: Device, address: string) {
    return (
      session.address === address && new Date(session.created_at.getTime() + 60000) > new Date()
    )
  }

  //register events
  const wsEvents: WsEvents = {
    authenticate: handleAuthEvent,
    mediaSourceRequest: handleMediaRequestEvent,
    updateMedia: handleUpdateMediaEvent,
    nextMedia: handleNextMediaEvent,
    prevMedia: handlePrevMediaEvent,
    pauseMedia: handlePauseMediaEvent,
    playMedia: handlePlayMediaEvent,
    mediaPositionRequest: handleMediaPositionRequest,
    mediaSeek: handleMediaSeek,
  }

  const wss = new WebSocketServer({ port: 8766 }, () => {
    console.log("Server started on ws://localhost:8766")
  })

  wss.on("connection", (ws: CustomWs, req) => {
    ws.isAlive = true
    ws.authorized = false
    ws.address = req.socket.remoteAddress

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
      console.log("ws closed")
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

  function handleAuthEvent(ws: CustomWs, payload: unknown) {
    if (
      payload &&
      typeof payload === "object" &&
      "sessionId" in payload &&
      typeof payload.sessionId === "string" &&
      sessions[payload.sessionId] &&
      ws.address &&
      isSessionValid(sessions[payload.sessionId], ws.address)
    ) {
      delete sessions[payload.sessionId]
      ws.authorized = true
      ws.send(createWsEvent("authSuccess"))
    } else {
      ws.send(createWsEvent("authFailure"))
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

  function handleMediaSeek(ws: CustomWs, payload: unknown) {
    if (
      ws.authorized &&
      payload &&
      typeof payload === "object" &&
      "position" in payload &&
      "id" in payload
    ) {
      player?.setPostition(payload as { id: string; position: string })
    }
  }

  httpsServer.listen(8765, () => console.log("Server started on https://localhost:8765"))
})()
