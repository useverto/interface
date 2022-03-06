import { Page, Spacer } from "@verto/ui";
import { useEffect, useRef, useState } from "react";
import { TokenType } from "../../utils/user";
import { updateNavTheme } from "../../store/actions";
import { useDispatch, useSelector } from "react-redux";
import { MaximizeIcon, MinimizeIcon } from "@iconicicons/react";
import tinycolor from "tinycolor2";
import Head from "next/head";
import Metas from "../../components/Metas";
import FastAverageColor from "fast-average-color";
import styles from "../../styles/views/art.module.sass";
import { RootState } from "../../store/reducers";
import { MuteIcon, UnmuteIcon } from "@primer/octicons-react";

const Art = (props: PropTypes) => {
  // fullscreen stuff

  const [fullScreen, setFullScreen] = useState(false);
  const previewEl = useRef<HTMLDivElement>();

  function toggleFullscreen() {
    if (!fullScreen) previewEl.current?.requestFullscreen();
    else document.exitFullscreen();
    setFullScreen((val) => !val);
  }

  useEffect(() => {
    const handler = () => setFullScreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);

    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // content type
  const [videoMuted, setVideoMuted] = useState(true);

  const [data, setData] = useState<{
    source: string;
    contentType: string;
    tokenType: "image" | "video" | "audio" | "other";
  }>();

  const dispatch = useDispatch();
  const navTheme = useSelector((state: RootState) => state.navThemeReducer);

  useEffect(() => {
    (async () => {
      // get data about the asset
      const res = await fetch(`https://arweave.net/${props.id}`);
      const resData = await res.clone().blob();
      const content_type = res.clone().headers.get("Content-Type");

      // determinate data type
      let tokenType: typeof data.tokenType;

      if (content_type.match(/^image\//)) tokenType = "image";
      else if (content_type.match(/^video\//)) tokenType = "video";
      else if (content_type.match(/^audio\//)) {
        tokenType = "audio";
        setVideoMuted(false);
      } else tokenType = "other";

      // set the data
      setData({
        source: URL.createObjectURL(resData),
        contentType: content_type,
        tokenType,
      });

      // set the navbar's color scheme
      if (tokenType === "audio" || tokenType === "other") return;

      try {
        const fac = new FastAverageColor();
        const avColor = fac.getColorFromArray4(
          new Uint8Array(await res.clone().arrayBuffer()),
          {
            algorithm: "dominant",
          }
        );
        const isLightScheme = tinycolor({
          r: avColor[0],
          g: avColor[1],
          b: avColor[2],
          a: avColor[3],
        }).isLight();

        dispatch(updateNavTheme(isLightScheme ? "BlurLight" : "BlurDark"));
      } catch {}
    })();
  }, [props.id]);

  //

  return (
    <>
      <Head>
        <title>Verto - {props.name}</title>
        <Metas title={props.name} image={`https://arweave.net/${props.id}`} />
      </Head>
      {(data?.tokenType === "image" && (
        <img
          src={data.source}
          alt="art"
          draggable={false}
          className={styles.Background}
        />
      )) ||
        (data?.tokenType === "video" && (
          <video
            controls={false}
            muted={true}
            autoPlay
            className={styles.Background}
          >
            <source
              src={`https://arweave.net/${props.id}`}
              type={data.source}
            />
          </video>
        ))}
      <div
        className={
          styles.Preview + " " + ((fullScreen && styles.FullScreenView) || "")
        }
        ref={previewEl}
      >
        {(data?.tokenType === "image" && (
          <img src={data.source} alt="art" draggable={false} />
        )) ||
          ((data?.tokenType === "video" || data?.tokenType === "audio") && (
            <video
              controls={data.tokenType === "audio"}
              muted={videoMuted}
              autoPlay
            >
              <source src={data.source} type={data.contentType} />
            </video>
          ))}
        <div
          className={
            styles.Actions +
            " " +
            ((navTheme === "BlurDark" && styles.DarkTone) ||
              (navTheme === "BlurLight" && styles.LightTone))
          }
        >
          {(data?.tokenType === "video" || data?.tokenType === "audio") && (
            <div
              className={styles.Action}
              onClick={() => setVideoMuted((val) => !val)}
            >
              {(videoMuted && <MuteIcon size={24} />) || (
                <UnmuteIcon size={24} />
              )}
            </div>
          )}
          <div className={styles.Action} onClick={toggleFullscreen}>
            {(fullScreen && <MinimizeIcon />) || <MaximizeIcon />}
          </div>
        </div>
      </div>
      <Page className={styles.ArtData}>
        <Spacer y={3} />
        <h1 className={styles.Title}>{props.name}</h1>
      </Page>
    </>
  );
};

interface PropTypes {
  id: string;
  name: string;
  ticker: string;
  price: number | "--";
  type?: TokenType;
}

export default Art;
