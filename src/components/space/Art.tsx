import {
  Avatar,
  Button,
  Card,
  Input,
  Spacer,
  useInput,
  useTheme,
  useToasts,
} from "@verto/ui";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { RootState } from "../../store/reducers";
import { MaximizeIcon, MinimizeIcon } from "@iconicicons/react";
import { MuteIcon, UnmuteIcon } from "@primer/octicons-react";
import { UserData } from "@verto/ui/dist/components/Card";
import { TokenType } from "../../utils/user";
import {
  fetchArtworkMetadata,
  fetchBalancesForAddress,
  fetchContract,
} from "verto-cache-interface";
import axios from "axios";
import Head from "next/head";
import Metas from "../../components/Metas";
import marked from "marked";
import useGeofence from "../../utils/geofence";
import styles from "../../styles/views/art.module.sass";

const Art = (props: PropTypes) => {
  const [fullScreen, setFullScreen] = useState(false);
  const [arPrice, setArPrice] = useState("--");
  const previewEl = useRef<HTMLDivElement>();
  const theme = useTheme();

  // TODO(@johnletey): SWR ...

  useEffect(() => {
    (async () => {
      //const price = await client.getPrice(props.id);
      const price = 1;
      setArPrice(
        price?.toLocaleString(undefined, {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        }) ?? "--"
      );
    })();
  }, []);

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

  const [state, setState] = useState(null);

  useEffect(() => {
    fetchContract(props.id).then(({ state }) => {
      if (state.settings)
        state.settings = Object.fromEntries(new Map(state.settings));

      setState(state);
    });
  }, []);

  const [userData, setUserData] = useState<UserData>();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const data = await fetchArtworkMetadata(props.id);

      setUserData({
        name: data.lister.name,
        usertag: data.lister.username,
        avatar: data.lister.image
          ? `https://arweave.net/${data.lister.image}`
          : undefined,
      });
    })();
  }, []);

  const [tokenType, setTokenType] = useState<
    "image" | "video" | "audio" | "other"
  >("image");
  const [contentType, setContentType] = useState("");
  const [videoMuted, setVideoMuted] = useState(true);

  useEffect(() => {
    (async () => {
      const content_type = (
        await fetch(`https://arweave.net/${props.id}`)
      ).headers.get("Content-Type");
      setContentType(content_type);

      if (content_type.match(/^image\//)) setTokenType("image");
      else if (content_type.match(/^video\//)) setTokenType("video");
      else if (content_type.match(/^audio\//)) {
        setTokenType("audio");
        setVideoMuted(false);
      } else setTokenType("other");
    })();
  }, []);

  const [arRate, setArRate] = useState(0);

  useEffect(() => {
    (async () => {
      const {
        data: {
          arweave: { usd: price },
        },
      } = await axios.get(
        "https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=usd"
      );
      setArRate(price);
    })();
  }, []);

  interface BitsInterface {
    quantity: number;
    priceAr: number;
    priceUSD: number;
  }

  const [view, setView] = useState<"preview" | "buy" | "sell">("preview");
  const bitsAmountInput = useInput<number>(0);
  const [totalSupply, setTotalSupply] = useState(0);

  useEffect(() => {
    if (!state) return;
    const circulatingSupply = Object.values(state.balances).reduce(
      (a: number, b: number) => a + b,
      0
    ) as number;

    let total: number = circulatingSupply;
    if (state.vault)
      for (const vault of Object.values(state.vault) as any) {
        total += vault
          .map((a: any) => a.balance)
          .reduce((a: number, b: number) => a + b, 0);
      }

    setTotalSupply(total);
  }, [state]);

  const [ownedAmount, setOwnedAmount] = useState(0);
  const address = useSelector((state: RootState) => state.addressReducer);

  useEffect(() => {
    if (!address) return;
    (async () => {
      const balances = await fetchBalancesForAddress(address);
      setOwnedAmount(
        balances.find(({ contractId }) => contractId === props.id)?.balance ?? 0
      );
    })();
  }, [address]);

  const arAmountInput = useInput<number>(0);
  const blockedCountry = useGeofence();

  const [loading, setLoading] = useState(false);
  const { setToast } = useToasts();

  async function order(mode: "buy" | "sell") {
    if (blockedCountry)
      return setToast({
        description: "Your country is limited",
        type: "error",
        duration: 4000,
      });

    setLoading(true);

    // TODO

    setLoading(false);
    bitsAmountInput.setStatus(undefined);
  }

  useEffect(() => {
    if (view === "preview") return;
    if (blockedCountry)
      setToast({
        description: "Your country is limited",
        type: "error",
        duration: 3250,
      });
  }, [view]);

  const [formattedDescription, setFormattedDescription] = useState("");

  useEffect(() => {
    const desc =
      state?.description ||
      state?.settings?.communityDescription ||
      "No description available...";

    setFormattedDescription(marked(desc));
  }, [state]);

  return (
    <>
      <Head>
        <title>Verto - {props.name}</title>
        <Metas title={props.name} image={`https://arweave.net/${props.id}`} />
      </Head>
      <Spacer y={3} />
      <h1 className={styles.Title}>{props.name}</h1>
      <Spacer y={3.75} />
      <div
        className={
          styles.Layout + " " + (fullScreen ? styles.FullScreenLayout : "")
        }
        ref={previewEl}
      >
        <Card className={styles.Preview}>
          {(tokenType === "image" && (
            <img
              src={`https://arweave.net/${props.id}`}
              alt="art"
              draggable={false}
            />
          )) ||
            ((tokenType === "video" || tokenType === "audio") && (
              <video
                controls={tokenType === "audio"}
                muted={videoMuted}
                autoPlay
              >
                <source
                  src={`https://arweave.net/${props.id}`}
                  type={contentType}
                />
              </video>
            ))}
          <div className={styles.Actions}>
            {tokenType === "video" && (
              <button
                onClick={() => setVideoMuted((val) => !val)}
                className={styles.Octicon}
              >
                {(videoMuted && <MuteIcon size={24} />) || (
                  <UnmuteIcon size={24} />
                )}
              </button>
            )}
            <button onClick={toggleFullscreen}>
              <MaximizeIcon />
            </button>
          </div>
        </Card>
        <Card className={styles.Form}>
          {(view === "preview" && (
            <>
              <div>
                <p className={styles.FormTitle}>Last price:</p>
                <h1 className={styles.Price}>
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
                  <span className={styles.FormTitle}>/bit (~{arPrice})</span>
                </h1>
                <Spacer y={0.85} />
                <Avatar
                  {...userData}
                  style={{ cursor: "pointer" }}
                  onClick={() => router.push(`/@${userData.usertag}`)}
                  className={styles.Avatar}
                />
                <Spacer y={0.85} />
                <p className={styles.FormTitle}>Description</p>
                <div
                  className={styles.Description}
                  dangerouslySetInnerHTML={{ __html: formattedDescription }}
                ></div>
              </div>
              <div>
                <Button
                  className={styles.FormBtn}
                  onClick={() => setView("buy")}
                  // TODO: remove disabled and add back the one below after gateway fix
                  // disabled={!address || bitsAvailable === 0}
                  disabled
                  // @ts-ignore
                  title="Swapping is temporarily disabled due to gateway issues, but we'll have this resolved ASAP!"
                >
                  Buy
                </Button>
                <Spacer y={0.85} />
                <Button
                  className={styles.FormBtn}
                  type="outlined"
                  onClick={() => setView("sell")}
                  // TODO: remove disabled and add back the one below after gateway fix
                  // disabled={!address || ownedAmount === 0}
                  disabled
                  // @ts-ignore
                  title="Swapping is temporarily disabled due to gateway issues, but we'll have this resolved ASAP!"
                >
                  Sell
                </Button>
              </div>
            </>
          )) || (
            <>
              <div>
                <Input
                  {...bitsAmountInput.bindings}
                  placeholder="Quantity of bits"
                  inlineLabel="Bits"
                  type="number"
                  // TODO
                  max={view === "sell" ? ownedAmount : 20000}
                  min={0}
                />
                <Spacer y={1.25} />
                <Input
                  {...arAmountInput.bindings}
                  readOnly={view === "buy"}
                  type="number"
                  inlineLabel="AR"
                />
                <Spacer y={1.25} />
                <Input
                  readOnly
                  currency="$"
                  type="number"
                  // TODO
                  value={10}
                  inlineLabel="USD"
                />
                <Spacer y={1.25} />
                {view === "buy" && (
                  <>
                    <p className={styles.FormTitle}>
                      10 bits available from 20 orders
                      <br />
                      {totalSupply} bits in total
                    </p>
                    <Spacer y={1.25} />
                  </>
                )}
              </div>
              <div>
                {(view === "buy" && (
                  <Button
                    className={styles.FormBtn}
                    onClick={() => order("buy")}
                    loading={loading}
                    disabled={blockedCountry}
                  >
                    Add to collection
                  </Button>
                )) || (
                  <Button
                    className={styles.FormBtn}
                    onClick={() => order("sell")}
                    loading={loading}
                    disabled={blockedCountry}
                  >
                    Sell bits
                  </Button>
                )}
                <Spacer y={0.85} />
                <Button
                  className={styles.FormBtn}
                  type="secondary"
                  onClick={() => {
                    if (loading) return;
                    setView("preview");
                  }}
                >
                  Back
                </Button>
              </div>
            </>
          )}
        </Card>
        {fullScreen && (
          <>
            {(tokenType === "image" && (
              <img
                src={`https://arweave.net/${props.id}`}
                alt="art"
                className={styles.FullScreenPreview}
                draggable={false}
              />
            )) ||
              ((tokenType === "video" || tokenType === "audio") && (
                <video
                  controls={tokenType === "audio"}
                  muted={videoMuted}
                  autoPlay
                  className={styles.FullScreenPreview}
                >
                  <source
                    src={`https://arweave.net/${props.id}`}
                    type={contentType}
                  />
                </video>
              ))}
            <div
              className={
                styles.Actions +
                " " +
                (theme === "Dark" ? styles.ActionsDark : "")
              }
            >
              {tokenType === "video" && (
                <button
                  onClick={() => setVideoMuted((val) => !val)}
                  className={styles.Octicon}
                >
                  {(videoMuted && <MuteIcon size={24} />) || (
                    <UnmuteIcon size={24} />
                  )}
                </button>
              )}
              <button onClick={toggleFullscreen}>
                <MinimizeIcon />
              </button>
            </div>
          </>
        )}
      </div>
      <Spacer y={4.5} />
      <h1 className="Title">
        {(view === "preview" && "History") || "Available bits"}
      </h1>
      <Spacer y={3} />
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
