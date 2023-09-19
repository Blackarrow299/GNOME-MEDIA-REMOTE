import { createWsEvent, isValidEventData } from "server/src/util/ws"

type WsAction = {
  open: (ws: WebSocket, ev: Event) => void
  error: (ws: WebSocket, ev: Event) => void
  close: (ws: WebSocket, ev: CloseEvent) => void
} & {
  [key: string]: (ws: WebSocket, payload?: unknown) => void
}

type CustomWsEvents = Record<string, (ws: WebSocket, payload?: unknown) => void>

class CustomWs {
  _ws: WebSocket | null
  private _openListners: WsAction["open"][]
  private _closeListners: WsAction["close"][]
  private _errorListners: WsAction["error"][]
  private _customEventsListners: CustomWsEvents
  // private _pingTimeout: NodeJS.Timeout | undefined
  constructor() {
    this._ws = null
    this._openListners = []
    this._closeListners = []
    this._errorListners = []
    this._customEventsListners = {}
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
      this._openListners.forEach((fn) => {
        fn(this._ws as WebSocket, ev)
      })
    }

    this._ws.onclose = (ev) => {
      this._closeListners.forEach((fn) => {
        fn(this._ws as WebSocket, ev)
      })
    }

    this._ws.onerror = (ev) => {
      this._errorListners.forEach((fn) => {
        fn(this._ws as WebSocket, ev)
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
        if (!this._customEventsListners[jsonData.event]) return
        this._customEventsListners[jsonData.event](this._ws!, jsonData.payload)
      }
    } catch (error) {
      console.log(error)
    }
  }

  on<T extends keyof WsAction>(ev: T, fn: WsAction[T]) {
    if (ev === "open") this._openListners.push(fn)
    else if (ev === "close") this._closeListners.push(fn)
    else if (ev === "error") this._errorListners.push(fn)
    else this._customEventsListners[ev as string] = fn
  }

  emit(name: string, payload?: unknown) {
    this._ws?.send(createWsEvent(name, payload))
  }

  close() {
    console.log("closing ws")
    this._ws?.close()
    this._ws = null
  }

  removeAllListeners() {
    console.log("removing listners")
    this._openListners = []
    this._closeListners = []
    this._errorListners = []
    this._customEventsListners = {}
  }

  // private heartbeat() {
  //     clearTimeout(this._pingTimeout);

  //     this._pingTimeout = setTimeout(() => {
  //         this.close();
  //     }, 10000 + 1000);
  // }
}

export type CustomWsType = CustomWs
export default new CustomWs()
