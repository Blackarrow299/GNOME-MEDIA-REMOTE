import { MaterialCommunityIcons } from "@expo/vector-icons"
import { Slider } from "@miblanchard/react-native-slider"
import { colors } from "app/theme"
import { useEffect, useState } from "react"
import { StyleSheet, TouchableOpacity, View, ViewProps } from "react-native"
import { AllPropsInType, AllPropsOutType } from "../../../bridge/src/mpris/Player"
import events from "app/utils/events"

interface Props extends ViewProps {
  media: Partial<AllPropsOutType>
  updateMediaProp: <T extends keyof AllPropsInType>(fieldName: T, value: AllPropsInType[T]) => void
}

const MediaVolume = ({ media, updateMediaProp, ...props }: Props) => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const screenClickEvent = events.on("screenClick", () => {
      setIsOpen(false)
    })
    return () => {
      events.removeEventListner(screenClickEvent)
    }
  }, [])

  return (
    <View {...props}>
      <TouchableOpacity style={styles.container} onPress={() => setIsOpen((state) => !state)}>
        <MaterialCommunityIcons
          name="volume-medium"
          size={26}
          color={media?.CanControl ? "black" : colors.palette.neutral400}
        />
        {isOpen && media.CanControl && (
          <View
            style={{
              position: "absolute",
              bottom: "200%",
              left: "-100%",
              backgroundColor: colors.palette.neutral100,
              transform: [{ rotateZ: "-90deg" }, { translateY: -35 }, { translateX: 35 }],
              height: 40,
              width: 150,
              borderRadius: 10,
              padding: 4,
              paddingHorizontal: 12,
              display: "flex",
              justifyContent: "center",
              alignItems: "stretch",
              elevation: 2,
            }}
          >
            <Slider
              value={media.Volume}
              minimumValue={0}
              maximumValue={1}
              maximumTrackTintColor="#cccccc"
              minimumTrackTintColor={colors.palette.primary500}
              thumbTintColor={colors.palette.primary500}
              thumbStyle={{ height: 10, width: 10 }}
              onSlidingComplete={(v) => updateMediaProp("Volume", +v[0].toFixed(2))}
            />
          </View>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
})

export default MediaVolume
