import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Button } from "./ui";

type AudioPlaybackButtonProps = {
  url: string;
  playLabel?: string;
  pauseLabel?: string;
  small?: boolean;
  variant?: "primary" | "outline" | "danger";
};

export function AudioPlaybackButton({
  url,
  playLabel = "Play Audio",
  pauseLabel = "Pause Audio",
  small = false,
  variant = "outline",
}: AudioPlaybackButtonProps) {
  const player = useAudioPlayer(url, { downloadFirst: true });
  const status = useAudioPlayerStatus(player);

  const toggle = () => {
    if (status.playing) player.pause();
    else player.play();
  };

  return (
    <Button
      label={status.playing ? pauseLabel : playLabel}
      small={small}
      variant={variant}
      onPress={toggle}
    />
  );
}