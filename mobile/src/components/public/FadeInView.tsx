import React, { useEffect } from "react";
import { ViewStyle, StyleProp } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

type FadeInViewProps = {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  translateY?: number;
};

export function FadeInView({
  children,
  delay = 0,
  style,
  translateY = 20,
}: FadeInViewProps) {
  const opacity = useSharedValue(0);
  const y = useSharedValue(translateY);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
    y.value = withDelay(delay, withTiming(0, { duration: 600 }));
  }, [delay, opacity, y]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
}