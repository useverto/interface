import {
  Avatar,
  Button,
  Card,
  Page,
  Spacer,
  useTheme,
  useToasts,
} from "@verto/ui";
import { useEffect, useRef, useState } from "react";
import { TokenType } from "../../utils/user";
import { updateNavTheme } from "../../store/actions";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { cardListAnimation, opacityAnimation } from "../../utils/animations";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  CloseCircleIcon,
  DollarIcon,
  EyeIcon,
  InformationIcon,
  MaximizeIcon,
  MinimizeIcon,
  RefreshIcon,
  ShareIcon,
} from "@iconicicons/react";
import {
  fetchArtworkMetadata,
  fetchContract,
  fetchUserCreations,
} from "verto-cache-interface";
import { ArtworkMetadata } from "verto-cache-interface/dist/calls/types/artwork-metadata";
import {
  BaseTokenState,
  calculateCirculatingSupply,
  calculateTotalSupply,
} from "../../utils/supply";
import { RootState } from "../../store/reducers";
import { MuteIcon, UnmuteIcon } from "@primer/octicons-react";
import { GQLTransactionInterface } from "ardb/lib/faces/gql";
import { UserInterface } from "@verto/js/dist/common/faces";
import { arPrice, gql, verto } from "../../utils/arweave";
import { formatAddress, shuffleArray } from "../../utils/format";
import { useRouter } from "next/router";
import marked, { Renderer } from "marked";
import Link from "next/link";
import tinycolor from "tinycolor2";
import Head from "next/head";
import Metas from "../../components/Metas";
import FastAverageColor from "fast-average-color";
import dayjs from "dayjs";
import styles from "../../styles/views/art.module.sass";

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
  const displayTheme = useTheme();

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
            algorithm: content_type === "image/gif" ? "sqrt" : "dominant",
          }
        );
        const isLightScheme = tinycolor({
          r: avColor[0],
          g: avColor[1],
          b: avColor[2],
          a: avColor[3],
        }).isLight();

        dispatch(updateNavTheme(isLightScheme ? "BlurDark" : "BlurLight"));
      } catch {}
    })();
  }, [props.id]);

  // state

  const [state, setState] = useState<BaseTokenState>();

  useEffect(() => {
    (async () => {
      // load contract state
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

    // create custom renderer
    const renderer = new Renderer();

    // custom link renderer to open all
    // markdown links in a new tab
    renderer.link = (href, title, text) =>
      `<a target="_blank" href="${href}" title="${title}">${text}</a>`;

    // render the description
    setFormattedDescription(marked(desc, { renderer }));
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
  }, [props.id, state]);

  // current address from arconnect
  const profile = useSelector((state: RootState) => state.addressReducer);

  // load owners' datas
  const [owners, setOwners] = useState<{ username: string; avatar?: string }[]>(
    []
  );

  useEffect(() => {
    (async () => {
      if (!state || !state.balances) return;
      setOwners([]);

      // addresses with balances (> 0)
      const holders = Object.keys(state.balances).filter(
        (address) => !!state.balances[address]
      );

      // load each owner's username & avatar on the fly
      for (let i = 0; i < holders.length; i++) {
        // load only for max. 4 users
        if (i > 4) break;

        // get user from community contract
        const user = await verto.user.getUser(holders[i]);

        setOwners((val) => [
          ...val,
          { username: user?.username || holders[i], avatar: user?.image },
        ]);
      }
    })();
  }, [state]);

  // load suggestions
  const [suggestions, setSuggestions] = useState<ArtworkMetadata[]>([]);

  useEffect(() => {
    (async () => {
      if (!minter || suggestions.length !== 0) return;
      setSuggestions([]);

      const creations = shuffleArray(
        await fetchUserCreations(minter.username)
      ).slice(0, 4);

      for (const id of creations) {
        const metadata = await fetchArtworkMetadata(id);

        if (!metadata) continue;
        setSuggestions((val) => [...val, metadata]);
      }
    })();
  }, [minter]);

  const router = useRouter();

  // load arweave price
  const [arweavePrice, setArweavePrice] = useState(0);

  useEffect(() => {
    (async () => {
      setArweavePrice(await arPrice());
    })();
  }, [props.price]);

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
              <div className={styles.Avatar}>
                <Avatar
                  usertag={minter.name || minter.username}
                  avatar={
                    (minter.image && `https://arweave.net/${minter.image}`) ||
                    undefined
                  }
                  onlyProfilePicture
                />
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
              {(typeof props.price !== "string" &&
                `(~${(props.price / arweavePrice).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })} AR)`) ||
                ""}
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
            {state?.allowMinting && (
              <>
                <Spacer y={0.25} />
                <span className={styles.InfoLink}>
                  <InformationIcon />
                  Allows minting more
                </span>
              </>
            )}
            <Spacer y={0.25} />
            <a
              href="https://www.notion.so/Foreign-Call-Protocol-Specification-61e221e5118a40b980fcaade35a2a718"
              className={styles.InfoLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              {(state?.invocations && state?.foreignCalls && (
                <>
                  <CheckCircleIcon />
                  Supports FCP
                </>
              )) || (
                <>
                  <CloseCircleIcon />
                  FCP not supported
                </>
              )}
            </a>
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
                <span
                  className={
                    styles.OwnerCount +
                    " " +
                    (displayTheme === "Dark" ? styles.DarkOwnerCount : "")
                  }
                >
                  {(state && Object.values(state.balances).length) || "0"}
                </span>
                <h1>
                  Owner
                  {state && Object.values(state.balances).length > 1 && "s"}
                </h1>
              </div>
              <Avatar.Group>
                {owners.map((holder, i) => (
                  <Avatar
                    usertag={holder.username}
                    avatar={
                      holder.avatar
                        ? `https://arweave.net/${holder.avatar}`
                        : undefined
                    }
                    onlyProfilePicture
                    key={i}
                  />
                ))}
              </Avatar.Group>
            </Card>
            <Spacer y={3} />
            <h2>
              Offers
              <div className={styles.OfferSelect}>
                <select>
                  <option value="recent">Most recent</option>
                  <option value="cheapest">Cheapest</option>
                  <option value="qty">Highest quantity</option>
                </select>
                <ChevronDownIcon />
              </div>
            </h2>
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
      <Page className={styles.Suggestions}>
        <Spacer y={2} />
        <h1
          className={styles.SuggestionTitle}
          style={{
            color:
              (navTheme === "BlurDark" && "#000") ||
              (navTheme === "BlurLight" && "#fff") ||
              undefined,
          }}
        >
          Suggested assets
        </h1>
        <Spacer y={2.5} />
        <div className={styles.SuggestedArts}>
          <AnimatePresence>
            {suggestions.slice(0, 4).map(
              (suggestion, i) =>
                suggestion?.name && (
                  <motion.div
                    className={styles.Item}
                    {...opacityAnimation(i)}
                    key={i}
                  >
                    <Card.Asset
                      name={suggestion.name}
                      userData={{
                        avatar: minter.image
                          ? `https://arweave.net/${minter.image}`
                          : undefined,
                        name: minter.name,
                        usertag: minter.username,
                      }}
                      // @ts-ignore
                      /** TODO */
                      price={undefined}
                      image={`https://arweave.net/${suggestion.id}`}
                      onClick={() => router.push(`/space/${suggestion.id}`)}
                    />
                  </motion.div>
                )
            )}
          </AnimatePresence>
        </div>
        <Spacer y={2.35} />
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
