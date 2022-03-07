import {
  Button,
  Card,
  generateAvatarGradient,
  Page,
  Spacer,
  useToasts,
} from "@verto/ui";
import { useEffect, useRef, useState } from "react";
import { TokenType } from "../../utils/user";
import { updateNavTheme } from "../../store/actions";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { cardListAnimation, opacityAnimation } from "../../utils/animations";
import {
  DollarIcon,
  EyeIcon,
  MaximizeIcon,
  MinimizeIcon,
  RefreshIcon,
  ShareIcon,
} from "@iconicicons/react";
import { fetchContract } from "verto-cache-interface";
import {
  BaseTokenState,
  calculateCirculatingSupply,
  calculateTotalSupply,
} from "../../utils/supply";
import { RootState } from "../../store/reducers";
import { MuteIcon, UnmuteIcon } from "@primer/octicons-react";
import { GQLTransactionInterface } from "ardb/lib/faces/gql";
import { UserInterface } from "@verto/js/dist/faces";
import { gql, verto } from "../../utils/arweave";
import Link from "next/link";
import tinycolor from "tinycolor2";
import Head from "next/head";
import Metas from "../../components/Metas";
import FastAverageColor from "fast-average-color";
import marked from "marked";
import styles from "../../styles/views/art.module.sass";
import dayjs from "dayjs";
import { formatAddress } from "../../utils/format";

const Art = (props: PropTypes) => {
  const { setToast } = useToasts();

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

  // fullscreen on "F" key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "f") return;
      setFullScreen((val) => !val);
      toggleFullscreen();
    };
    window.addEventListener("keypress", handler);

    return () => window.removeEventListener("keypress", handler);
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

  // state

  const [state, setState] = useState<BaseTokenState>();

  useEffect(() => {
    (async () => {
      setState((await fetchContract(props.id)).state);
    })();
  }, [props.id]);

  // supply
  const [supplyData, setSupplyData] = useState({
    totalSupply: 0,
    circulatingSupply: 0,
  });

  useEffect(() => {
    if (!state) return;

    setSupplyData({
      totalSupply: calculateTotalSupply(state),
      circulatingSupply: calculateCirculatingSupply(state),
    });
  }, [state]);

  // description
  const [formattedDescription, setFormattedDescription] = useState("");

  useEffect(() => {
    const desc =
      state?.description ||
      state?.settings?.communityDescription ||
      "No description available...";

    setFormattedDescription(marked(desc));
  }, [state]);

  // minting data
  const [minter, setMinter] = useState<
    UserInterface & { isAddress?: boolean }
  >();
  const [mintDate, setMintDate] = useState<Date>(new Date());

  useEffect(() => {
    (async () => {
      try {
        // load tx info
        const tx = (await gql
          .search("transaction")
          .id(props.id)
          .find()) as GQLTransactionInterface;

        if (tx?.block?.timestamp) {
          // multiply by 1000 to get Date API compatible value
          setMintDate(new Date(tx.block.timestamp * 1000));
        }

        // get minter
        const user = await verto.user.getUser(tx.owner.address);

        if (user) setMinter(user);
        // fill with empty data
        else
          setMinter({
            username: tx.owner.address,
            name: "",
            addresses: [],
            isAddress: true,
          });
      } catch {
        setToast({
          type: "error",
          description: "Failed to load mint data",
          duration: 2000,
        });
      }
    })();
  }, [props.id]);

  const profile = useSelector((state: RootState) => state.addressReducer);

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
        {minter && (
          <Link href={`/@${minter.username}`}>
            <a className={styles.UserChip}>
              <div
                className={
                  styles.Avatar +
                  " " +
                  ((!minter.image && styles.Gradient) || "")
                }
                style={{
                  background:
                    (!minter.image &&
                      generateAvatarGradient(minter?.username || "")
                        .gradient) ||
                    undefined,
                }}
              >
                {(minter.image && (
                  <img
                    src={`https://arweave.net/${minter.image}`}
                    alt="avatar"
                  />
                )) || <span>{minter.username[0].toUpperCase()}</span>}
              </div>
              <span>
                @
                {(minter.isAddress && formatAddress(minter.username, 7)) ||
                  minter.username}
              </span>
            </a>
          </Link>
        )}
        <Spacer y={4.1} />
        <h1 className={styles.Title}>{props.name}</h1>
        <Spacer y={2} />
        <div className={styles.DataContent}>
          <div className={styles.Texts}>
            <p className={styles.SubTitle}>Lowest price:</p>
            <p className={styles.SubTitle} style={{ alignItems: "flex-end" }}>
              <span className={styles.Price}>
                {(props.price !== "--" && (
                  <>
                    $
                    {props.price.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2,
                    })}
                  </>
                )) ||
                  props.price}
              </span>
              /bit
              <Spacer x={0.4} />
              {/** TODO */}
              (~12.25 AR)
            </p>
            <Spacer y={1.8} />
            <p className={styles.SubTitle}>Description</p>
            <Spacer y={0.1} />
            <div
              className={styles.Description}
              dangerouslySetInnerHTML={{ __html: formattedDescription }}
            ></div>
            <Spacer y={1.8} />
            <h2>Info</h2>
            <Spacer y={1} />
            <span className={styles.InfoLink}>
              <RefreshIcon />
              Circulating supply:{" "}
              {supplyData.circulatingSupply.toLocaleString()} {props.ticker}
            </span>
            <Spacer y={0.25} />
            <span className={styles.InfoLink}>
              <DollarIcon />
              Total supply: {supplyData.totalSupply.toLocaleString()}{" "}
              {props.ticker}
            </span>
            <Spacer y={0.25} />
            <a
              href={`https://viewblock.io/arweave/tx/${props.id}`}
              className={styles.InfoLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ShareIcon />
              Minted on {dayjs(mintDate).format("MMMM DD, YYYY")}
            </a>
            <Spacer y={0.25} />
            <a
              href={`https://viewblock.io/arweave/address/${props.id}`}
              className={styles.InfoLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <EyeIcon />
              Viewblock
            </a>
          </div>
          <div>
            <Card className={styles.Owners}>
              <div className={styles.LeftSide}>
                <span className={styles.OwnerCount}>
                  {(state && Object.values(state.balances).length) || "0"}
                </span>
                <h1>
                  Owner
                  {state && Object.values(state.balances).length > 1 && "s"}
                </h1>
              </div>
              {/** TODO: styles.Users */}
            </Card>
            <Spacer y={3} />
            <h2>Offers</h2>
            <Spacer y={1.7} />
            <AnimatePresence>
              <motion.div
                {...cardListAnimation(0)}
                key={0}
                className={styles.OfferItem}
              >
                <Card.Bits
                  quantity={17}
                  price={{ usd: 10.23, qty: 22, ticker: "VRT" }}
                />
                <Spacer y={1.4} />
              </motion.div>
              <motion.div
                {...cardListAnimation(1)}
                key={1}
                className={styles.OfferItem}
              >
                <Card.Bits
                  quantity={6}
                  price={{ usd: 8.23, qty: 17, ticker: "ARDRIVE" }}
                />
                <Spacer y={1.4} />
              </motion.div>
              <motion.div
                {...cardListAnimation(2)}
                key={2}
                className={styles.OfferItem}
              >
                <Card.Bits
                  quantity={23}
                  price={{ usd: 18.95, qty: 33, ticker: "VRT" }}
                />
                <Spacer y={1.4} />
              </motion.div>
            </AnimatePresence>
            <AnimatePresence>
              {state && state?.balances?.[profile] && (
                <motion.div {...opacityAnimation()}>
                  <Button
                    type="outlined"
                    style={{ width: "100%", marginTop: "2.1em" }}
                  >
                    Sell
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
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
