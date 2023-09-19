import { MaterialCommunityIcons } from "@expo/vector-icons"
import { Slider } from "@miblanchard/react-native-slider"
import { colors } from "app/theme"
import { useState } from "react"
import { StyleSheet, View, ViewProps } from "react-native"
import { AllPropsInType, AllPropsOutType } from "server/src/mpris/Player"

interface Props extends ViewProps {
    media: Partial<AllPropsOutType>
    updateMediaProp: <T extends keyof AllPropsInType>(fieldName: T, value: AllPropsInType[T]) => void
}

const MediaVolume = ({ media, updateMediaProp, ...props }: Props) => {

    const [isOpen, setIsOpen] = useState(false)

    return (
        <View {...props}>
            <View style={styles.container}>
                <MaterialCommunityIcons
                    style={styles.btn}
                    name="volume-medium"
                    size={26}
                    color={media?.CanControl ? 'black' : colors.palette.neutral400}
                    onPress={() => setIsOpen(state => !state)}
                />
                {isOpen && media.CanControl && <View style={{
                    position: 'absolute',
                    bottom: '200%',
                    left: '-100%',
                    backgroundColor: colors.palette.neutral100,
                    transform: [{ rotateZ: '-90deg' }, { translateY: -35 }, { translateX: 35 }],
                    height: 40,
                    width: 150,
                    borderRadius: 10,
                    padding: 4,
                    paddingHorizontal: 12,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'stretch',
                    elevation: 2
                }}>
                    <Slider
                        containerStyle={styles.slider}
                        value={media.Volume}
                        minimumValue={0}
                        maximumValue={1}
                        maximumTrackTintColor="#cccccc"
                        minimumTrackTintColor={colors.palette.primary500}
                        thumbTintColor={colors.palette.primary500}
                        thumbStyle={{ height: 10, width: 10 }}
                        onSlidingComplete={(v) => updateMediaProp("Volume", +v[0].toFixed(2))}
                    />
                </View>}

            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    btn: {
        // left: 0,
        // position: "absolute",
    },
    container: {
        position: 'relative',
    },
    slider: {


    }
})

export default MediaVolume