import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native"
import ws from "app/utils/websocketsService"
import { useEffect, useState } from "react"
import { colors, typography } from "app/theme"
import TextTicker from "react-native-text-ticker"
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import { AllPropsInType, AllPropsOutType } from "../../../bridge/src/mpris/Player"
import MediaSlider from "app/components/MediaSlider"
import MediaVolume from "app/components/MediaVolume"
import events from "app/utils/events"

const PlayerScreen = ({ navigation, route }) => {
  const server = route.params.targetDevice
  const sessionId = route.params.sessionId

  const [loading, setLoading] = useState(true)
  const [media, setMedia] = useState<Partial<AllPropsOutType>>({})

  useEffect(() => {
    if (ws._ws) setLoading(false)
    ws.connect(`ws://${server.address}:8766`)

    const openEvent = ws.on("open", () => {
      ws.emit("authenticate", { sessionId })
    })

    const authSuccessEvent = ws.on("authSuccess", () => {
      ws.emit("mediaSourceRequest")
      setLoading(false)
    })

    const authFailEvent = ws.on("authFailure", () => {
      Alert.alert("Oops!", "Something went wrong. Please try again. 😊")
      navigation.replace("DeviceDiscovery")
    })

    const wsErrorEvent = ws.on("error", () => {
      Alert.alert("Oops!", "Connection error.")
      navigation.replace("DeviceDiscovery")
    })

    const wsCloseEvent = ws.on("close", () => {
      Alert.alert("Oops!", "Connection lost.")
      navigation.replace("DeviceDiscovery")
    })

    const mediaUpdatedEvent = ws.on("mediaUpdated", (_, data) => {
      setMedia((state) => {
        return { ...state, ...(data as Partial<AllPropsOutType>) }
      })
    })

    const mediaSourceChangedEvent = ws.on("mediaSourceChanged", (_, data) => {
      if (data) setMedia(data as AllPropsOutType)
    })

    return () => {
      ws.removeEventListner(openEvent)
      ws.removeEventListner(mediaUpdatedEvent)
      ws.removeEventListner(mediaSourceChangedEvent)
      ws.removeEventListner(wsCloseEvent)
      ws.removeEventListner(wsErrorEvent)
      ws.removeEventListner(authSuccessEvent)
      ws.removeEventListner(authFailEvent)
    }
  }, [])

  function updateMediaProp<T extends keyof AllPropsInType>(fieldName: T, value: AllPropsInType[T]) {
    if (media.CanControl) {
      ws.emit("updateMedia", { [fieldName]: value })
    }
  }

  if (loading)
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.palette.primary500} />
      </View>
    )

  return (
    <TouchableWithoutFeedback touchSoundDisabled onPress={() => events.emit("screenClick")}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.imageContainer}>
            {media?.Metadata?.art && (
              <Image source={{ uri: media?.Metadata?.art }} style={styles.image} />
            )}
          </View>
        </View>
        <View style={styles.titleArtistTextContainer}>
          <TextTicker
            style={styles.mediaTitleText}
            scrollSpeed={20}
            loop
            bounce
            repeatSpacer={50}
            marqueeDelay={1000}
          >
            {media?.Metadata?.title}
          </TextTicker>
          <TextTicker
            style={styles.mediaArtistText}
            scrollSpeed={20}
            loop
            bounce
            repeatSpacer={50}
            marqueeDelay={1000}
          >
            {media?.Metadata?.artist}
          </TextTicker>
        </View>
        <View style={styles.mediaControllContainer}>
          <View style={styles.mediaControllHeader}>
            <TouchableOpacity
              onPress={() => {
                media.CanControl && updateMediaProp("Shuffle", !media.Shuffle)
              }}
            >
              <MaterialCommunityIcons
                name={!media.CanControl || media.Shuffle ? "shuffle" : "shuffle-disabled"}
                size={22}
                color={!media.CanControl ? colors.palette.neutral400 : colors.palette.neutral900}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                updateMediaProp(
                  "LoopStatus",
                  media.CanControl && media.LoopStatus === "None" ? "Track" : "None",
                )
              }}
            >
              <MaterialCommunityIcons
                name={!media.CanControl || media.LoopStatus !== "None" ? "repeat" : "repeat-off"}
                size={22}
                color={!media.CanControl ? colors.palette.neutral400 : colors.palette.neutral900}
              />
            </TouchableOpacity>
          </View>
          <MediaSlider media={media} />
          <View style={styles.mediaControllFooter}>
            <MediaVolume style={styles.volumeBtn} media={media} updateMediaProp={updateMediaProp} />
            <View style={styles.mediaPlaybackControll}>
              <TouchableOpacity onPress={() => media?.CanGoPrevious && ws.emit("prevMedia")}>
                <Ionicons
                  name="md-play-skip-back"
                  size={30}
                  color={
                    media?.CanGoPrevious ? colors.palette.primary500 : colors.palette.neutral400
                  }
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.playBtn}
                onPress={() => {
                  ws.emit(media?.PlaybackStatus === "Playing" ? "pauseMedia" : "playMedia")
                }}
              >
                {media?.PlaybackStatus === "Playing" ? (
                  <MaterialCommunityIcons
                    name="pause"
                    size={40}
                    color={media?.CanPause ? "white" : colors.palette.neutral400}
                  />
                ) : (
                  <MaterialCommunityIcons
                    name="play"
                    size={40}
                    color={media?.CanPlay ? "white" : colors.palette.neutral400}
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => media?.CanGoNext && ws.emit("nextMedia")}>
                <Ionicons
                  name="md-play-skip-forward"
                  size={30}
                  color={media?.CanGoNext ? colors.palette.primary500 : colors.palette.neutral400}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
  },
  image: {
    borderRadius: 20,
    height: "100%",
    resizeMode: "cover",
    width: "100%",
  },
  imageContainer: {
    backgroundColor: colors.palette.neutral300,
    borderRadius: 20,
    elevation: 2,
    height: 200,
    width: "80%",
  },
  loading: {
    paddingTop: 16,
  },
  mediaArtistText: {
    color: colors.textDim,
    fontFamily: typography.primary.medium,
  },
  mediaControllContainer: {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
    width: "100%",
  },
  mediaControllFooter: {
    alignItems: "center",
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 4,
    width: "100%",
  },
  mediaControllHeader: {
    alignItems: "center",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    width: "100%",
  },
  mediaPlaybackControll: {
    alignItems: "center",
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
  },
  mediaTitleText: {
    color: colors.text,
    fontFamily: typography.primary.semiBold,
    fontSize: 20,
    fontWeight: "500",
  },
  playBtn: {
    alignItems: "center",
    backgroundColor: colors.palette.primary500,
    borderRadius: 30,
    display: "flex",
    height: 60,
    justifyContent: "center",
    marginHorizontal: 6,
    width: 60,
  },
  titleArtistTextContainer: {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
    paddingVertical: 16,
  },
  volumeBtn: {
    left: 0,
    position: "absolute",
  },
})

export default PlayerScreen
