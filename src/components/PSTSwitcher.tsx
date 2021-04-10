import axios from "axios";
import { useEffect, useState } from "react";
import { fetchAsset } from "../utils/arweave";

const PSTSwitcher = () => {
  const [firstLoad, setFirstLoad] = useState(true);
  const [images, setImages] = useState({
    img1: "",
    img2: "",
    img3: "",
    img4: "",
  });

  const fetchImages = async () => {
    let firstLoad: boolean;
    setFirstLoad((val) => {
      firstLoad = val;
      return val;
    });

    const { data: res } = await axios.get(
      "https://v2.cache.verto.exchange/site/communities/random"
    );
    if (firstLoad) {
      for (let i = 0; i < res.length; i++) {
        try {
          const src = await fetchAsset(res[i].logo);
          setImages((val) => ({ ...val, [`img${i + 1}`]: src }));
        } catch {}
      }
      setFirstLoad(false);
    } else {
      const index = Math.floor(Math.random() * 4);
      try {
        const src = await fetchAsset(res[index].logo);
        setImages((val) => ({
          ...val,
          [`img${index + 1}`]: {
            ...res[index],
            src,
          },
        }));
      } catch {}
    }
  };

  useEffect(() => {
    const main = async () => {
      await fetchImages();
      setTimeout(fetchImages, 30000);
    };
    main();
  }, []);

  return (
    <svg
      width="339"
      viewBox="0 0 339 305"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g filter="url(#filter0_d)">
        <rect
          x="229.715"
          y="67"
          width="91.6293"
          height="91.6293"
          rx="11"
          transform="rotate(15 229.715 67)"
          fill="url(#pattern0)"
        />
      </g>
      <g filter="url(#filter1_d)">
        <rect
          x="112"
          y="89"
          width="61"
          height="66.9804"
          fill="url(#pattern1)"
        />
      </g>
      <g filter="url(#filter2_d)">
        <rect
          x="20"
          y="45.5"
          width="71"
          height="71"
          rx="11"
          transform="rotate(-30 20 45.5)"
          fill="url(#pattern2)"
        />
      </g>
      <g filter="url(#filter3_d)">
        <rect
          x="78"
          y="186.552"
          width="91"
          height="91"
          rx="11"
          transform="rotate(-15 78 186.552)"
          fill="url(#pattern3)"
        />
      </g>
      <defs>
        <filter
          id="filter0_d"
          x="186"
          y="57"
          width="152.222"
          height="152.222"
          rx="11"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dy="10" />
          <feGaussianBlur stdDeviation="10" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow"
            result="shape"
          />
        </filter>
        <pattern
          id="pattern0"
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <use xlinkHref="#image0" transform="scale(0.004)" />
        </pattern>
        <filter
          id="filter1_d"
          x="92"
          y="79"
          width="101"
          height="106.98"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dy="10" />
          <feGaussianBlur stdDeviation="10" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow"
            result="shape"
          />
        </filter>
        <pattern
          id="pattern1"
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <use
            xlinkHref="#image1"
            transform="translate(-0.000261208) scale(0.00195034 0.0017762)"
          />
        </pattern>
        <filter
          id="filter2_d"
          x="0"
          y="0"
          width="136.988"
          height="136.988"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dy="10" />
          <feGaussianBlur stdDeviation="10" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow"
            result="shape"
          />
        </filter>
        <pattern
          id="pattern2"
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <use xlinkHref="#image2" transform="scale(0.00208333)" />
        </pattern>
        <filter
          id="filter3_d"
          x="58"
          y="153"
          width="151.452"
          height="151.452"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dy="10" />
          <feGaussianBlur stdDeviation="10" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow"
            result="shape"
          />
        </filter>
        <pattern
          id="pattern3"
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <use xlinkHref="#image3" transform="scale(0.00195312)" />
        </pattern>
        <image id="image0" width="250" height="250" xlinkHref={images.img1} />
        <image id="image1" width="513" height="563" xlinkHref={images.img2} />
        <image id="image2" width="480" height="480" xlinkHref={images.img3} />
        <image id="image3" width="512" height="512" xlinkHref={images.img4} />
      </defs>
    </svg>
  );
};

export default PSTSwitcher;
