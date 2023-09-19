export function createWsEvent(name: string, payload?: unknown) {
  return JSON.stringify({
    event: name,
    payload: payload,
  })
}

export function isValidEventData(jsonData: unknown) {
  if (typeof jsonData === "object" && jsonData !== null) {
    if ("event" in jsonData && typeof jsonData.event === "string") {
      return true
    }
  }
  return false
}
