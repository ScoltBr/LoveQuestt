import { useCallback } from 'react';

const SOUNDS = {
  SUCCESS: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3', // Pop/Ding
  NOTIFICATION: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3', // Soft alert
  LEVEL_UP: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Chime/Celebration
  CLICK: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Subtle click
};

export function useSound() {
  const playSound = useCallback((url: string) => {
    try {
      const audio = new Audio(url);
      audio.volume = 0.4;
      audio.play().catch(e => console.log("Audio play blocked by browser policy"));
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  }, []);

  return {
    playSuccess: () => playSound(SOUNDS.SUCCESS),
    playNotification: () => playSound(SOUNDS.NOTIFICATION),
    playLevelUp: () => playSound(SOUNDS.LEVEL_UP),
    playClick: () => playSound(SOUNDS.CLICK),
  };
}
