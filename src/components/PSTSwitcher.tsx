import axios from "axios";
import { useEffect, useState } from "react";
import { fetchAsset } from "../utils/arweave";
import { AnimatePresence, motion } from "framer-motion";
import styles from "../styles/components/PSTSwitcher.module.sass";

const PSTSwitcher = () => {
  const [firstLoad, setFirstLoad] = useState(true);
  const [images, setImages] = useState({
    img1: {
      id: "",
      src: "",
    },
    img2: {
      id: "",
      src: "",
    },
    img3: {
      id: "",
      src: "",
    },
    img4: {
      id: "",
      src: "",
    },
  });

  const fetch = async (index: number): Promise<boolean> => {
    const { data: res } = await axios.get(
      "https://v2.cache.verto.exchange/site/communities/random"
    );

    let images: any;
    setImages((val) => {
      images = val;
      return val;
    });

    console.log(images);

    for (const value of Object.values(images)) {
      console.log(value);
      // @ts-ignore
      if (value.id === res[index].id) return false;
    }

    try {
      const src = await fetchAsset(res[index].logo);

      setImages((val) => ({
        ...val,
        [`img${index + 1}`]: {
          id: res[index].logo,
          src,
        },
      }));

      return true;
    } catch {
      return false;
    }
  };

  const fetchImages = async () => {
    let firstLoad: boolean;
    setFirstLoad((val) => {
      firstLoad = val;
      return val;
    });

    if (firstLoad) {
      for (let i = 0; i < 4; i++) {
        let res = await fetch(i);
        while (!res) res = await fetch(i);
      }
      setFirstLoad(false);
    } else {
      let index = Math.floor(Math.random() * 4);
      let res = await fetch(index);
      while (!res) res = await fetch(index);
    }
  };

  useEffect(() => {
    const main = async () => {
      await fetchImages();
      setTimeout(main, 2500);
    };
    main();
  }, []);

  return (
    <div className={styles.PSTSwitcher}>
      <AnimatePresence>
        {images.img1.src !== "" && (
          <motion.div
            key={images.img1.id}
            className={styles.Logo}
            style={{ top: "2em", left: "2.8em" }}
            initial={{ scale: 0, opacity: 0.3, rotate: -30 }}
            animate={{ scale: 1, opacity: 1, rotate: -30 }}
            exit={{ scale: 0, opacity: 0.3, rotate: -30 }}
            transition={{ duration: 0.23, ease: "backInOut" }}
          >
            <img
              src={images.img1.src}
              alt="pst"
              draggable={false}
              style={{ width: "71px" }}
            />
          </motion.div>
        )}
        {images.img2.src !== "" && (
          <motion.div
            key={images.img2.id}
            className={styles.Logo}
            style={{ top: "50%", left: "50%" }}
            initial={{
              scale: 0,
              opacity: 0.3,
              translateX: "-50%",
              translateY: "-50%",
            }}
            animate={{
              scale: 1,
              opacity: 1,
              translateX: "-50%",
              translateY: "-50%",
            }}
            exit={{
              scale: 0,
              opacity: 0.3,
              translateX: "-50%",
              translateY: "-50%",
            }}
            transition={{ duration: 0.23, ease: "backInOut" }}
          >
            <img
              src={images.img2.src}
              alt="pst"
              draggable={false}
              style={{ width: "61px" }}
            />
          </motion.div>
        )}
        {images.img3.src !== "" && (
          <motion.div
            key={images.img3.id}
            className={styles.Logo}
            style={{ top: "4.5em", right: 0 }}
            initial={{ scale: 0, opacity: 0.3, rotate: 15 }}
            animate={{ scale: 1, opacity: 1, rotate: 15 }}
            exit={{ scale: 0, opacity: 0.3, rotate: 15 }}
            transition={{ duration: 0.23, ease: "backInOut" }}
          >
            <img
              src={images.img3.src}
              alt="pst"
              draggable={false}
              style={{ width: "92px" }}
            />
          </motion.div>
        )}
        {images.img4.src !== "" && (
          <motion.div
            key={images.img4.id}
            className={styles.Logo}
            style={{ bottom: -10, left: "40%" }}
            initial={{
              scale: 0,
              opacity: 0.3,
              translateX: "-50%",
              rotate: -15,
            }}
            animate={{ scale: 1, opacity: 1, translateX: "-50%", rotate: -15 }}
            exit={{ scale: 0, opacity: 0.3, translateX: "-50%", rotate: -15 }}
            transition={{ duration: 0.23, ease: "backInOut" }}
            draggable={false}
          >
            <img
              src={images.img4.src}
              alt="pst"
              draggable={false}
              style={{ width: "90px" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PSTSwitcher;
