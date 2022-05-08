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
 * Expand animations
 *
 * @param i Optional item key
 *
 * @returns Animation bindings for framer-motion
 */
export const expandAnimation = (i = 0) => ({
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0 },
  transition: {
    opacity: {
      duration: 0.176,
    },
    height: {
      duration: 0.23,
    },
    ease: "easeInOut",
    delay: i * 0.058,
  },
});

export const infiniteScrollAnimation = {
  initial: {
    opacity: 0,
    y: 50,
    transition: {
      ease: [0.78, 0.14, 0.15, 0.86],
    },
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      ease: [0.78, 0.14, 0.15, 0.86],
    },
  },
};

export const navMobileAnimation = {
  initial: {
    opacity: 0,
    y: 200,
    left: "50%",
    translateX: "-50%",
  },
  animate: {
    opacity: 1,
    y: 0,
    left: "50%",
    translateX: "-50%",
  },
  exit: {
    opacity: 0,
    y: 200,
    left: "50%",
    translateX: "-50%",
  },
  transition: {
    duration: 0.23,
    ease: "easeInOut",
  },
};
