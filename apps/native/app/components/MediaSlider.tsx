import { Slider } from "@miblanchard/react-native-slider"
import { colors } from "app/theme"
import { useEffect, useRef, useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { AllPropsOutType } from "../../../bridge/src/mpris/Player"
import ws from "app/utils/websocketsService"

interface Props {
    media: Partial<AllPropsOutType>
}

let interval: NodeJS.Timeout | undefined

const formatTime = (lengthInNs: number) => {
    const lengthInSeconds = lengthInNs / 1e6;
    const minutes = Math.floor(lengthInSeconds / 60);
    const seconds = Math.floor(lengthInSeconds % 60);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const MediaSlider = ({ media }: Props) => {
    const sliderRef = useRef<Slider>(null)
    const [value, setValue] = useState(media.Position || 0)

    useEffect(() => {
        const mediaPositonResEvent = ws.on("mediaPositionResponse", (_, position) => {
            setValue(position as number || 0)
        })

        return () => { ws.removeEventListner(mediaPositonResEvent) }
    }, [])

    useEffect(() => {
        // setValue(position || 0)
        if (media.PlaybackStatus === 'Playing' && !interval) {
            interval = setInterval(() => {
                // setValue((state) => state + 1e6)
                ws.emit("mediaPositionRequest")
            }, 1000)
        } else if ((media.PlaybackStatus === 'Paused' || media.PlaybackStatus === 'Stopped') && interval) {
            clearInterval(interval)
            interval = undefined
        }
    }, [media])

    const seek = (position: number[]) => {
        ws.emit("mediaSeek", { position: position[0].toFixed(0).toString(), id: media.Metadata?.trackId })
    }

    return (
        <View style={styles.container}>
            <Slider
                ref={sliderRef}
                value={+value}
                minimumValue={0}
                maximumValue={+(media.Metadata?.length || 1)}
                maximumTrackTintColor="#cccccc"
                minimumTrackTintColor={colors.palette.primary500}
                thumbTintColor={colors.palette.primary500}
                thumbStyle={{ height: 10, width: 10 }}
                onSlidingComplete={seek}
                containerStyle={{ paddingVertical: 0, marginVertical: 0, padding: 0, margin: 0 }}
            />
            <View style={styles.textContainer}>
                <Text style={styles.text}>{formatTime(+value)}</Text>
                <Text style={styles.text}>{media.Metadata?.length ? formatTime(+media.Metadata.length) : ''}</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        alignItems: "stretch",
        // flex: 1,
        justifyContent: "center",
        // marginLeft: 10,
        // marginRight: 10,
        // marginVertical: 16,
        width: "100%",
    },
    text: {
        color: colors.text
    },
    textContainer: {
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between'
    }
})

export default MediaSlider