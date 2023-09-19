import { ActivityIndicator, Image, StyleSheet, View } from "react-native"
import ws from "app/utils/websocketsService"
import { useEffect, useState } from "react"
import { colors, typography } from "app/theme"
import TextTicker from "react-native-text-ticker"
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import { AllPropsInType, AllPropsOutType } from "../../../bridge/src/mpris/Player"
import MediaSlider from "app/components/MediaSlider"
import MediaVolume from "app/components/MediaVolume"

const PlayerScreen = () => {
  const [loading, setLoading] = useState(true)
  const [media, setMedia] = useState<Partial<AllPropsOutType>>({})
  useEffect(() => {
    console.log(ws._ws ? "connected" : "disconnected")

    ws.emit("mediaSourceRequest")

    ws.on("mediaUpdated", (_, data) => {
      setMedia((state) => {
        return { ...state, ...(data as Partial<AllPropsOutType>) }
      })
    })

    ws.on("mediaSourceChanged", (_, data) => {
      setLoading(false)
      if (data) setMedia(data as AllPropsOutType)
    })

    return () => ws.removeAllListeners()
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
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.imageContainer}>
          {media?.Metadata?.art && <Image source={{ uri: media?.Metadata?.art }} style={styles.image} />}
        </View>
      </View>
      <View style={styles.titleArtistTextContainer}>
        <TextTicker
          style={styles.mediaTitleText}
          scrollSpeed={500}
          loop
          bounce
          repeatSpacer={50}
          marqueeDelay={1000}
        >
          {media?.Metadata?.title}
        </TextTicker>
        <TextTicker
          style={styles.mediaArtistText}
          duration={3000}
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
          {!media?.CanControl ? (
            <MaterialCommunityIcons name="shuffle" size={22} color={colors.palette.neutral400} />
          ) : !media.Shuffle ? (
            <MaterialCommunityIcons
              name="shuffle-disabled"
              size={22}
              color={colors.palette.neutral900}
              onPress={() => updateMediaProp("Shuffle", true)}
            />
          ) : (
            <MaterialCommunityIcons
              name="shuffle" size={22}
              color={colors.palette.neutral900}
              onPress={() => updateMediaProp("Shuffle", false)}
            />
          )}
          {!media?.CanControl ? (
            <MaterialCommunityIcons name="repeat" size={22} color={colors.palette.neutral400} />
          ) : media.LoopStatus === "None" ? (
            <MaterialCommunityIcons
              name="repeat-off"
              size={22}
              color="black"
              onPress={() => updateMediaProp("LoopStatus", "Track")}
            />
          ) : (
            <MaterialCommunityIcons
              name="repeat"
              size={22}
              color="black"
              onPress={() => updateMediaProp("LoopStatus", "None")}
            />
          )}
        </View>
        <MediaSlider media={media} position={media.Position ? +media.Position : undefined} length={media.Metadata?.length ? +media.Metadata?.length : undefined} />
        <View style={styles.mediaControllFooter}>
          {/* <MaterialCommunityIcons
            style={styles.volumeBtn}
            name="volume-medium"
            size={26}
            color={media?.CanControl ? 'black' : colors.palette.neutral400}
          /> */}
          <MediaVolume style={styles.volumeBtn} media={media} updateMediaProp={updateMediaProp} />
          <View style={styles.mediaPlaybackControll}>
            <Ionicons
              name="md-play-skip-back"
              size={30}
              color={media?.CanGoPrevious ? colors.palette.primary500 : colors.palette.neutral400}
              onPress={() => (media?.CanGoPrevious) && ws.emit("prevMedia")}
            />
            <View style={styles.playBtn}>
              {media?.PlaybackStatus === "Playing" ? (
                <MaterialCommunityIcons
                  name="pause"
                  size={40}
                  color={media?.CanPause ? 'white' : colors.palette.neutral400}
                  onPress={() => ws.emit("pauseMedia")}
                />
              ) : (
                <MaterialCommunityIcons
                  name="play"
                  size={40}
                  color={media?.CanPlay ? 'white' : colors.palette.neutral400}
                  onPress={() => ws.emit("playMedia")}
                />
              )}
            </View>
            <Ionicons
              name="md-play-skip-forward"
              size={30}
              color={media?.CanGoNext ? colors.palette.primary500 : colors.palette.neutral400}
              onPress={() => (media?.CanGoNext) && ws.emit("nextMedia")}
            />
          </View>
          <MaterialCommunityIcons
            style={styles.deviceVolumeBtn}
            name="devices"
            size={22}
            color={'black'}
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  deviceVolumeBtn: {
    position: "absolute",
    right: 0,
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
    width: "80%"
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
