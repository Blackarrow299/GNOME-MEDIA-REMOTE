import cp from "child_process"
import os from "os"

export function getComputerName() {
  switch (process.platform) {
    case "darwin":
      return cp.execSync("scutil --get ComputerName").toString().trim()
    case "linux":
      const prettyname = cp.execSync("hostnamectl --pretty").toString().trim()
      return prettyname === "" ? os.hostname() : prettyname
    default:
      return os.hostname()
  }
}
