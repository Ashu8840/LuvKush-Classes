import React, { useEffect } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const SQUARES = [
  { size: 40, leftPct: 0.1, duration: 12000, delay: 0 },
  { size: 80, leftPct: 0.25, duration: 15000, delay: 2000 },
  { size: 30, leftPct: 0.55, duration: 10000, delay: 4000 },
  { size: 60, leftPct: 0.75, duration: 18000, delay: 1000 },
  { size: 50, leftPct: 0.9, duration: 14000, delay: 3000 },
  { size: 70, leftPct: 0.4, duration: 16000, delay: 5000 },
];

const { width: SCREEN_W } = Dimensions.get("window");

function FloatingSquare({
  size,
  leftPct,
  duration,
  delay,
}: {
  size: number;
  leftPct: number;
  duration: number;
  delay: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.linear }),
        -1,
        false,
      ),
    );
  }, [delay, duration, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: progress.value * -900 },
      { rotate: `${progress.value * 360}deg` },
    ],
    opacity:
      progress.value < 0.08
        ? progress.value / 0.08
        : progress.value > 0.92
          ? (1 - progress.value) / 0.08
          : 1,
  }));

  return (
    <Animated.View
      style={[
        styles.square,
        {
          width: size,
          height: size,
          left: SCREEN_W * leftPct * 0.9,
          borderRadius: size * 0.15,
        },
        animatedStyle,
      ]}
    />
  );
}

export function FloatingSquares() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {SQUARES.map((sq, i) => (
        <FloatingSquare key={i} {...sq} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  square: {
    position: "absolute",
    bottom: -100,
    borderWidth: 2,
    borderColor: "rgba(250, 204, 21, 0.3)",
    backgroundColor: "rgba(250, 204, 21, 0.1)",
  },
});