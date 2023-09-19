import { Variant } from "dbus-next"

export interface MetadataRaw {
  "mpris:length"?: Variant<string>
  "mpris:trackid"?: Variant<string>
  "xesam:album"?: Variant<string>
  "xesam:artist"?: Variant<string[]>
  "xesam:title"?: Variant<string>
  "mpris:artUrl"?: Variant<string>
}
type MetadataValue<Key extends keyof MetadataRaw> = MetadataRaw[Key] extends Variant<infer Value>
  ? Value
  : never

const defaultMetadata = {
  length: "0",
  trackId: "",
  album: "",
  artist: [""],
  title: "",
  art: "",
}

type DefaultMetadataKeyType = keyof typeof defaultMetadata

const metaDataMap = {
  "mpris:length": "length",
  "mpris:trackid": "trackId",
  "xesam:album": "album",
  "xesam:artist": "artist",
  "xesam:title": "title",
  "mpris:artUrl": "art",
}

export async function parseMetadata(
  rawMetadata: Promise<MetadataRaw | undefined> | MetadataRaw | undefined,
) {
  const metadataIn = await rawMetadata
  if (metadataIn) {
    let key: keyof MetadataRaw
    for (key in metadataIn) {
      if (metadataIn[key]?.value) {
        const mappedKey = metaDataMap[key] as DefaultMetadataKeyType
        if (mappedKey)
          defaultMetadata[mappedKey] = metadataIn[key]?.value as MetadataValue<typeof key>
      }
    }
  }
  return defaultMetadata
}
