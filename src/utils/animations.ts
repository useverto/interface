import { useEffect, useState } from "react";

/**
 * Animation standard for card lists
 *
 * @param i List item key
 *
 * @returns Animation bindings for framer-motion
 */
export const cardListAnimation = (i: number) => ({
  initial: { opacity: 0, scale: 0.83 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.83 },
  transition: {
    duration: 0.23,
    ease: "easeInOut",
    delay: i * 0.023,
  },
});

/**
 * Animation standard for normal cards
 *
 * @param i Card key
 *
 * @returns Animation bindings for framer-motion
 */
export const cardAnimation = (i: number) => ({
  initial: { opacity: 0, translateY: 5 },
  animate: { opacity: 1, translateY: 0 },
  exit: { opacity: 0, translateY: 5 },
  transition: {
    duration: 0.25,
    ease: "easeInOut",
    delay: i * 0.058,
  },
});

/**
 * Opacity animations
 *
 * @param i Optional item key
 *
 * @returns Animation bindings for framer-motion
 */
export const opacityAnimation = (i = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: {
    duration: 0.23,
    ease: "easeInOut",
    delay: i * 0.058,
  },
});

/**
 * Count up from a number, to a number
 */
export const useCountUp = ({
  start = 0,
  end,
  duration = 1400,
  frameDuration = 1000 / 60,
  decimals = 5,
}: CountUpProps) => {
  const [state, setState] = useState(start);
  const [toEnd, setToEnd] = useState(end);
  const [multiply, setMultiply] = useState(0);

  const decimalLength = (val: number) =>
    val.toString().split(".")[1]?.length ?? 0;
  const easeOut = (t: number) => t * (2 - t);

  useEffect(() => {
    const newVal =
      Math.round(end * Math.pow(10, decimals)) / Math.pow(10, decimals);
    setToEnd(newVal);
    setMultiply(Math.pow(10, decimalLength(newVal)) ?? 1);
  }, [end, decimals]);

  // TODO start from start param
  useEffect(() => {
    if (toEnd === 0) return;

    let frame = 0;

    const totalFrames = Math.round(duration / frameDuration);
    const counter = setInterval(() => {
      frame++;
      setState(
        Math.round(toEnd * multiply * easeOut(frame / totalFrames) + start)
      );

      if (frame === totalFrames) clearInterval(counter);
    }, frameDuration);
  }, [toEnd]);

  return state / multiply;
};

interface CountUpProps {
  start?: number;
  end: number;
  duration?: number;
  frameDuration?: number;
  decimals?: number;
}
