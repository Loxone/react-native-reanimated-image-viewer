import React, {
    useMemo,
    useEffect,
    useImperativeHandle,
    forwardRef,
    useState,
    useRef,
    useLayoutEffect
} from "react";

import { useWindowDimensions, Image } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDecay,
    withTiming,
} from "react-native-reanimated";

export type ImageViewerProps = {
    imageUrl: string;
    width: number;
    height: number;
    scale: number;
    translateY: number;
    translateX: number;
    onRequestClose: () => void;
    loadCallback: (load: boolean) => void;
    repositionCallback: (repositon: boolean) => void;
};

const ImageViewer = forwardRef((props: ImageViewerProps, ref) => {
    const [didLoad, setDidLoad] = useState(false);
    const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });

    const dimensions = useWindowDimensions();

    const scale = useSharedValue(props.scale);
    const savedScale = useSharedValue(props.scale);

    const translateY = useSharedValue(props.translateY);
    const savedTranslateY = useSharedValue(props.translateY);

    const translateX = useSharedValue(props.translateX);
    const savedTranslateX = useSharedValue(props.translateX);
    
    const MAX_ZOOM_SCALE = 3;

    const { width: finalWidth, height: finalHeight } = useMemo(() => {
        function ruleOfThree(
            firstValue: number,
            firstResult: number,
            secondValue: number,
        ) {
            const secondResult = (firstResult * secondValue) / firstValue;

            return secondResult;
        }

        const resizedBasedOnWidth = {
            width: dimensions.width,
            height: ruleOfThree(props.width, dimensions.width, props.height),
        };

        const resizedBasedOnHeight = {
            width: ruleOfThree(props.height, dimensions.height, props.width),
            height: dimensions.height,
        };

        if (props.width === props.height) {
            const smallestScreenDimension = Math.min(
                dimensions.width,
                dimensions.height,
            );

            return {
                width: smallestScreenDimension,
                height: smallestScreenDimension,
            };
        } else if (props.width > props.height) {
            return resizedBasedOnWidth;
        } else {
            if (resizedBasedOnHeight.width > dimensions.width) {
                return resizedBasedOnWidth;
            }

            return resizedBasedOnHeight;
        }
    }, [props.width, props.height, dimensions.width, dimensions.height]);

    const pinchGesture = Gesture.Pinch()
        .onStart(() => {
            props.repositionCallback(true); 
            savedScale.value = scale.value;
        })
        .onUpdate((event) => {
            scale.value = savedScale.value * event.scale;
        })
        .onEnd(() => {
            props.repositionCallback(false);
        });

    const panGesture = Gesture.Pan()
        .onBegin(() => {
            props.repositionCallback(true);
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
        })
        .onUpdate((event) => {
            if (scale.value < 1) {
                return;
            }

            const realImageWidth = finalWidth * scale.value;

            const maxTranslateX =
                realImageWidth <= dimensions.width
                    ? 0
                    : (realImageWidth - dimensions.width) / 2;
            const minTranslateX =
                realImageWidth <= dimensions.width
                    ? 0
                    : -(realImageWidth - dimensions.width) / 2;

            const possibleNewTranslateX = savedTranslateX.value + event.translationX;

            if (possibleNewTranslateX > maxTranslateX) {
                translateX.value = maxTranslateX;
            } else if (possibleNewTranslateX < minTranslateX) {
                translateX.value = minTranslateX;
            } else {
                translateX.value = possibleNewTranslateX;
            }

            if (scale.value > 1) {
                const realImageHeight = finalHeight * scale.value;

                const maxTranslateY =
                    realImageHeight <= dimensions.height
                        ? 0
                        : (realImageHeight - dimensions.height) / 2;
                const minTranslateY =
                    realImageHeight <= dimensions.height
                        ? 0
                        : -(realImageHeight - dimensions.height) / 2;

                const possibleNewTranslateY =
                    savedTranslateY.value + event.translationY;

                if (possibleNewTranslateY > maxTranslateY) {
                    translateY.value = maxTranslateY;
                } else if (possibleNewTranslateY < minTranslateY) {
                    translateY.value = minTranslateY;
                } else {
                    translateY.value = possibleNewTranslateY;
                }
            } else {
                translateY.value = savedTranslateY.value + event.translationY;
            }
        })
        .onEnd((event) => {
            if (scale.value === 1) {
                translateY.value = withTiming(0);
                translateX.value = withTiming(0);
            } else if (scale.value < 1) {
                scale.value = withTiming(1);
                translateX.value = withTiming(0);
                translateY.value = withTiming(0);
            } else if (scale.value > MAX_ZOOM_SCALE) {
                scale.value = withTiming(MAX_ZOOM_SCALE);
            } else {
                const realImageWidth = finalWidth * scale.value;

                const maxTranslateX =
                    realImageWidth <= dimensions.width
                        ? 0
                        : (realImageWidth - dimensions.width) / 2;
                const minTranslateX =
                    realImageWidth <= dimensions.width
                        ? 0
                        : -(realImageWidth - dimensions.width) / 2;

                translateX.value = withDecay({
                    velocity: event.velocityX,
                    clamp: [minTranslateX, maxTranslateX],
                });

                const realImageHeight = finalHeight * scale.value;

                const maxTranslateY =
                    realImageHeight <= dimensions.height
                        ? 0
                        : (realImageHeight - dimensions.height) / 2;
                const minTranslateY =
                    realImageHeight <= dimensions.height
                        ? 0
                        : -(realImageHeight - dimensions.height) / 2;

                translateY.value = withDecay({
                    velocity: event.velocityY,
                    clamp: [minTranslateY, maxTranslateY],
                });
            }
            props.repositionCallback(false);
        });

    const doubleTap = Gesture.Tap()
        .onStart((event) => {
            if (scale.value > 1) {
                scale.value = withTiming(1);
                translateX.value = withTiming(0);
                translateY.value = withTiming(0);
            } else {
                scale.value = withTiming(MAX_ZOOM_SCALE);

                const realImageWidth = finalWidth * MAX_ZOOM_SCALE;

                const maxTranslateX = (realImageWidth - dimensions.width) / 2;
                const minTranslateX = -(realImageWidth - dimensions.width) / 2;

                const possibleNewTranslateX =
                    (finalWidth / 2 - event.x) * MAX_ZOOM_SCALE;

                let newTranslateX = 0;

                if (possibleNewTranslateX > maxTranslateX) {
                    newTranslateX = maxTranslateX;
                } else if (possibleNewTranslateX < minTranslateX) {
                    newTranslateX = minTranslateX;
                } else {
                    newTranslateX = possibleNewTranslateX;
                }

                translateX.value = withTiming(newTranslateX);

                const realImageHeight = finalHeight * MAX_ZOOM_SCALE;

                const maxTranslateY =
                    realImageHeight <= dimensions.height
                        ? 0
                        : (realImageHeight - dimensions.height) / 2;
                const minTranslateY =
                    realImageHeight <= dimensions.height
                        ? 0
                        : -(realImageHeight - dimensions.height) / 2;

                const possibleNewTranslateY =
                    (finalHeight / 2 - event.y) * MAX_ZOOM_SCALE;

                let newTranslateY = 0;

                if (possibleNewTranslateY > maxTranslateY) {
                    newTranslateY = maxTranslateY;
                } else if (possibleNewTranslateY < minTranslateY) {
                    newTranslateY = minTranslateY;
                } else {
                    newTranslateY = possibleNewTranslateY;
                }

                translateY.value = withTiming(newTranslateY);
            }
        })
        .numberOfTaps(2);

    useImperativeHandle(ref, () => ({
        incScale() {
            if (scale.value < MAX_ZOOM_SCALE) {
                scale.value = withTiming(scale.value + 0.5);
            }
            savedScale.value = scale.value;
        },
        decScale() {
            if (scale.value > 1) {
                scale.value = withTiming(scale.value - 0.5);
            }
            savedScale.value = scale.value;
        },
        getImageData() {
            return {
                translateX: translateX.value,
                translateY: translateY.value,
                scale: scale.value,
                ...imgDimensions
            };
        },
    }));

    useEffect(() => {
        props.loadCallback(didLoad);
    }, [didLoad]);

    const renderCount = useRef(0);
    useLayoutEffect(() => {
      if (renderCount.current < 2) {
        renderCount.current += 1;
      } else {
        scale.value = 1
        translateX.value = 0
        translateY.value = 0
      }
    }, [props.imageUrl]);

    useEffect(() => {
        setDidLoad(false);

        Image.getSize(props.imageUrl, (width, height) => {
            setImgDimensions({ width, height });
        });

    }, [props.imageUrl]);

    const imageContainerAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
            ],
        };
    });

    const imageAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    scale: scale.value,
                },
            ],
        };
    }, []);

    const composedGestures = Gesture.Simultaneous(pinchGesture, panGesture);
    const allGestures = Gesture.Exclusive(composedGestures, doubleTap);

    return (
        <GestureDetector gesture={allGestures}>
            <Animated.View
                style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#000",
                }}
            >
                <Animated.View style={imageContainerAnimatedStyle}>
                    <Animated.Image
                        style={[
                            imageAnimatedStyle,
                            {
                                width: finalWidth,
                                height: finalHeight,
                            },

                            imgDimensions.height > imgDimensions.width
                                ? { resizeMode: "contain" }
                                : { resizeMode: "cover" },
                        ]}
                        source={{
                            uri: props.imageUrl,
                        }}
                        onLoadEnd={() => {
                            setDidLoad(true);
                        }}
                    />
                </Animated.View>
            </Animated.View>
        </GestureDetector>
    );
});

export default ImageViewer;

