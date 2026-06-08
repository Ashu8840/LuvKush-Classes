import { Image, ImageStyle, StyleProp, View, ViewStyle } from "react-native";
import { useTheme } from "../contexts/ThemeContext";

const logo = require("../../assets/logo.png");

type LogoSize = "xs" | "sm" | "md" | "lg";

/** Width-led sizes + scale to offset PNG padding (1536×1024 canvas) */
const SIZES: Record<LogoSize, { width: number; height: number; scale: number }> = {
  xs: { width: 170, height: 113, scale: 1.25 },
  sm: { width: 200, height: 133, scale: 1.3 },
  md: { width: 230, height: 153, scale: 1.35 },
  lg: { width: 280, height: 187, scale: 1.35 },
};

/** Visible clip height — prevents scaled logo from overflowing into panel/nav */
const CLIP_HEIGHT: Record<LogoSize, number> = {
  xs: 72,
  sm: 85,
  md: 100,
  lg: 120,
};

const CLIP_HEIGHT_COMPACT: Record<LogoSize, number> = {
  xs: 62,
  sm: 72,
  md: 78,
  lg: 92,
};

type BrandLogoProps = {
  style?: StyleProp<ImageStyle>;
  frameStyle?: StyleProp<ViewStyle>;
  size?: LogoSize;
  framed?: boolean;
  /** Tighter clip for drawer/sidebar — line sits directly below logo */
  compact?: boolean;
};

export function BrandLogo({ style, frameStyle, size = "md", framed = false, compact = false }: BrandLogoProps) {
  const { colors } = useTheme();
  const { width, height, scale } = SIZES[size];
  const verticalLift = compact ? 0 : 15;

  const image = (
    <Image
      source={logo}
      accessibilityLabel="Luv Kush Coaching Center"
      style={[
        {
          width: width * scale,
          height: height * scale,
          resizeMode: "contain",
          marginHorizontal: -((width * (scale - 1)) / 2),
          marginTop: -((height * (scale - 1)) / 2) - verticalLift,
          marginBottom: -((height * (scale - 1)) / 2) + verticalLift,
        },
        style,
      ]}
    />
  );

  if (!framed) return image;

  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: 10,
          paddingHorizontal: 5,
          paddingVertical: compact ? 0 : 4,
          alignSelf: "flex-start",
          overflow: "hidden",
          width: "100%",
          maxWidth: "100%",
        },
        frameStyle,
      ]}
    >
      <View
        style={{
          height: compact ? CLIP_HEIGHT_COMPACT[size] : CLIP_HEIGHT[size],
          width: "100%",
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",

        }}
      >
        {image}
      </View>
    </View>
  );
}