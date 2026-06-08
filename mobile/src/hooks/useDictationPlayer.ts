import { useCallback, useEffect, useState } from "react";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

export function useDictationPlayer(audioUrl: string | undefined) {
  const player = useAudioPlayer(audioUrl ?? null, { downloadFirst: true });
  const status = useAudioPlayerStatus(player);
  const [elapsed, setElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    if (audioUrl) player.replace(audioUrl);
  }, [audioUrl, player]);

  useEffect(() => {
    if (!timerActive) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [timerActive]);

  useEffect(() => {
    if (status.didJustFinish) setTimerActive(false);
  }, [status.didJustFinish]);

  const togglePlay = useCallback(() => {
    if (!audioUrl) return;
    if (status.playing) {
      player.pause();
      return;
    }
    if (!timerActive) setTimerActive(true);
    player.play();
  }, [audioUrl, status.playing, timerActive, player]);

  const reset = useCallback(async () => {
    player.pause();
    await player.seekTo(0);
    setElapsed(0);
    setTimerActive(false);
  }, [player]);

  return {
    playing: status.playing,
    elapsed,
    togglePlay,
    reset,
  };
}