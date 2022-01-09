import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/router";
import { fetchRandomCommunitiesWithMetadata } from "verto-cache-interface";
import styles from "../styles/components/PSTSwitcher.module.sass";

const PSTSwitcher = () => {
  const [firstLoad, setFirstLoad] = useState(true);
  const [images, setImages] = useState({
    img1: {
      id: "",
      logo: "",
    },
    img2: {
      id: "",
      logo: "",
    },
    img3: {
      id: "",
      logo: "",
    },
    img4: {
      id: "",
      logo: "",
    },
  });
  const router = useRouter();

  const fetch = async (index: number): Promise<boolean> => {
    const res = await fetchRandomCommunitiesWithMetadata();

    let imgs: typeof images;
    setImages((val) => {
      imgs = val;
      return val;
    });

    if (imgs)
      for (const value of Object.values(imgs)) {
        // @ts-ignore
        if (value.id === res[index].id) return false;
      }

    try {
      setImages((val) => ({
        ...val,
        [`img${index + 1}`]: {
          id: res[index].id,
          logo: res[index].logo,
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
        {images.img1.logo !== "" && (
          <motion.div
            key={images.img1.id + "_1"}
            className={styles.Logo}
            style={{ top: "2em", left: "2.8em" }}
            initial={{ scale: 0, opacity: 0.3, rotate: -30 }}
            animate={{ scale: 1, opacity: 1, rotate: -30 }}
            exit={{ scale: 0, opacity: 0.3, rotate: -30 }}
            transition={{ duration: 0.23, ease: "backInOut" }}
            onClick={() => router.push(`space/${images.img1.id}`)}
          >
            <img
              src={`https://arweave.net/${images.img1.logo}`}
              alt="pst"
              draggable={false}
              style={{ width: "71px" }}
            />
          </motion.div>
        )}
        {images.img2.logo !== "" && (
          <motion.div
            key={images.img2.id + "_2"}
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
            onClick={() => router.push(`space/${images.img2.id}`)}
          >
            <img
              src={`https://arweave.net/${images.img2.logo}`}
              alt="pst"
              draggable={false}
              style={{ width: "61px" }}
            />
          </motion.div>
        )}
        {images.img3.logo !== "" && (
          <motion.div
            key={images.img3.id + "_3"}
            className={styles.Logo}
            style={{ top: "4.5em", right: 0 }}
            initial={{ scale: 0, opacity: 0.3, rotate: 15 }}
            animate={{ scale: 1, opacity: 1, rotate: 15 }}
            exit={{ scale: 0, opacity: 0.3, rotate: 15 }}
            transition={{ duration: 0.23, ease: "backInOut" }}
            onClick={() => router.push(`space/${images.img3.id}`)}
          >
            <img
              src={`https://arweave.net/${images.img3.logo}`}
              alt="pst"
              draggable={false}
              style={{ width: "92px" }}
            />
          </motion.div>
        )}
        {images.img4.logo !== "" && (
          <motion.div
            key={images.img4.id + "_4"}
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
            onClick={() => router.push(`space/${images.img4.id}`)}
          >
            <img
              src={`https://arweave.net/${images.img4.logo}`}
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
