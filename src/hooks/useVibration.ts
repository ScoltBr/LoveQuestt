export const useVibration = () => {
  const vibrate = (pattern: number | number[] = 10) => {
    if ("vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        console.warn("Vibration failed", e);
      }
    }
  };

  const success = () => vibrate([10, 30, 10]);
  const light = () => vibrate(10);
  const medium = () => vibrate(20);

  return { vibrate, success, light, medium };
};
