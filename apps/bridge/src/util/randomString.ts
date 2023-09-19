export function randomString(length = 6): string {
  const chars = "QWERTYUIOPASDFGHJKLZXCVBNM123456789"
  let res = ""
  for (let i = 0; i < length; i++) {
    const random = Math.floor(Math.random() * (chars.length - 1))
    res += chars[random]
  }
  return res
}

export function randomNumberString(length = 6): string {
  const numbers = "1234567890"
  let res = ""
  for (let i = 0; i < length; i++) {
    const random = Math.floor(Math.random() * (numbers.length - 1))
    res += numbers[random]
  }
  return res
}
