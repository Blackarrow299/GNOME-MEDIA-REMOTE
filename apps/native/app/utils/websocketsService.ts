import { createWsEvent, isValidEventData } from "../../../bridge/src/util/ws"
import { EventsHandler } from "./events"

type WsAction = {
  open: (ws: WebSocket, ev: Event) => void
  error: (ws: WebSocket, ev: Event) => void
  close: (ws: WebSocket, ev: CloseEvent) => void
} & {
  [key: string]: (ws: WebSocket, payload?: unknown) => void
}

class CustomWs extends EventsHandler {
  _ws: WebSocket | null

  constructor() {
    super()
    this._ws = null
  }

  connect(url: string) {
    console.log("ws trying to connect")

    if (this._ws && this._ws.url !== url) {
      this.close()
      this._ws = new WebSocket(url)
    } else if (!this._ws) {
      this._ws = new WebSocket(url)
    }

    this._ws.onopen = (ev) => {
      (this.events.open?.length > 0) && this.events.open.forEach((e) => {
        e.callback(this._ws as WebSocket, ev)
      })
    }

    this._ws.onclose = (ev) => {
      (this.events.close?.length > 0) && this.events.close.forEach((e) => {
        e.callback(this._ws as WebSocket, ev)
      })
    }

    this._ws.onerror = (ev) => {
      (this.events.error?.length > 0) && this.events.error.forEach((e) => {
        e.callback(this._ws as WebSocket, ev)
      })
    }

    this._ws.onmessage = (ev) => {
      this.parseWsEvent(ev.data)
    }
  }

  private parseWsEvent(data: any): void {
    try {
      const jsonData = JSON.parse(data.toString()) as { event: string; payload?: unknown }
      if (isValidEventData(jsonData)) {
        if (!this.events[jsonData.event]) return
        this.events[jsonData.event].forEach((e) => e.callback(this._ws, jsonData.payload))
      }
    } catch (error) {
      console.log(error)
    }
  }

  on<T extends keyof WsAction>(ev: T, fn: WsAction[T]) {
    return this.addEventListner(ev as string, fn)
  }

  emit(name: string, payload?: unknown) {
    this._ws?.send(createWsEvent(name, payload))
  }

  close() {
    console.log("closing ws")
    this.removeAllListeners()
    this._ws?.close()
    this._ws = null
  }
}

export type CustomWsType = CustomWs
export default new CustomWs()
