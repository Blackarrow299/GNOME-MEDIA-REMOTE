import dgram from "dgram"
export default function listenForDiscoveryMsg(hostname: string) {
  const udpServer = dgram.createSocket("udp4")

  udpServer.on("message", (msg, rinfo) => {
    const message = msg.toString()

    if (message === "DiscoverDevices_15dsa15s8") {
      // Respond to the discovery message with device information
      const deviceInfo = {
        name: hostname,
      }

      udpServer.send(
        JSON.stringify(deviceInfo),
        0,
        JSON.stringify(deviceInfo).length,
        rinfo.port,
        rinfo.address,
      )
    }
  })

  udpServer.bind(60537, "0.0.0.0", () => {
    console.log("UDP Server is listening on port 60537")
  })
}
