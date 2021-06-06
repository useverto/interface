import {
  Avatar,
  Button,
  Card,
  Input,
  Loading,
  Page,
  Spacer,
  useInput,
  useTheme,
  useToasts,
} from "@verto/ui";
import { useEffect, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import { GraphDataConfig, GraphOptions } from "../../utils/graph";
import { swapItems } from "../../utils/storage_names";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { RootState } from "../../store/reducers";
import { MaximizeIcon, MinimizeIcon } from "@iconicicons/react";
import { MuteIcon, UnmuteIcon } from "@primer/octicons-react";
import { UserData } from "@verto/ui/dist/components/Card";
import { randomEmoji } from "../../utils/user";
import Verto from "@verto/js";
import axios from "axios";
import Head from "next/head";
import Metas from "../../components/Metas";
import dayjs from "dayjs";
import tokenStyles from "../../styles/views/token.module.sass";
import artStyles from "../../styles/views/art.module.sass";

const client = new Verto();

interface PropTypes {
  id: string;
  name: string;
  ticker: string;
  price: number | "--";
  type?: "art" | "community" | "custom";
}

const Token = (props: PropTypes) => {
  // TODO: custom layout

  return (
    <Page>
      {(props.type === "community" && <Community {...props} />) || (
        <Art {...props} />
      )}
    </Page>
  );
};

const Community = (props: PropTypes) => {
  const router = useRouter();
  if (router.isFallback) return <></>;

  // TODO(@johnletey): SWR ...

  const periods = ["24h", "1w", "1m", "1y", "ALL"];
  const [selectedPeriod, setSelectedPeriod] = useState<string>("ALL");
  const [state, setState] = useState(null);
  const theme = useTheme();
  const address = useSelector((state: RootState) => state.addressReducer);

  useEffect(() => {
    axios
      .get(`https://v2.cache.verto.exchange/${props.id}`)
      .then(({ data }) => {
        let state = data.state;
        if (state.settings)
          state.settings = Object.fromEntries(new Map(state.settings));

        setState(state);
      });
  }, []);

  const [history, setHistory] = useState<
    {
      date: string;
      price: number;
    }[]
  >();

  useEffect(() => {
    (async () => {
      const priceHistory = await client.getPriceHistory(props.id);
      const filterDates = (date) => {
        const timeType =
          (selectedPeriod === "24h" && "day") ||
          (selectedPeriod === "1w" && "week") ||
          (selectedPeriod === "1m" && "month") ||
          "year";

        if (selectedPeriod === "ALL") return true;
        return dayjs(new Date(date)).isAfter(dayjs().subtract(1, timeType));
      };
      const prices = Object.keys(priceHistory)
        .filter((date) => filterDates(date))
        .map((key) => ({
          date: key,
          price: priceHistory[key],
        }))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
      setHistory(prices);
    })();
  }, [selectedPeriod]);

  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    if (state) {
      const circulatingSupply = Object.values(state.balances).reduce(
        (a: number, b: number) => a + b,
        0
      ) as number;

      let totalSupply: number = circulatingSupply;
      if (state.vault)
        for (const vault of Object.values(state.vault) as any) {
          totalSupply += vault
            .map((a: any) => a.balance)
            .reduce((a: number, b: number) => a + b, 0);
        }

      const marketCap =
        props.price === "--"
          ? 0
          : (totalSupply * props.price).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });

      setMetrics({
        marketCap,
        circulatingSupply: circulatingSupply.toLocaleString(),
        totalSupply: totalSupply.toLocaleString(),
      });
    }
  }, [state]);

  const amount = useInput<number>();
  const target = useInput<string>();

  const { setToast } = useToasts();
  const [transferring, setTransferring] = useState(false);

  const transfer = async () => {
    if (amount.state <= 0) return amount.setStatus("error");

    if (target.state === "") return target.setStatus("error");

    const balances = await client.getBalances(address);
    const tokenBalance = balances.find(({ id }) => id === props.id);

    if (!tokenBalance || tokenBalance.balance < amount.state)
      return amount.setStatus("error");

    setTransferring(true);

    try {
      await client.transfer(amount.state, props.id, target.state);
      setToast({
        description: `Transferring ${amount.state.toLocaleString()} ${
          props.ticker
        }`,
        type: "success",
        duration: 2600,
      });
    } catch {
      setToast({
        description: `Could not transfer ${props.ticker}`,
        type: "success",
        duration: 2600,
      });
    }

    setTransferring(false);
  };

  const goToSwap = () => {
    localStorage.setItem(
      swapItems,
      JSON.stringify({
        val: {
          input: "AR",
          output: props.id,
        },
      })
    );
    router.push("/swap");
  };

  return (
    <>
      <Head>
        <title>Verto - {props.name}</title>
        <Metas title={props.name} localImage={`api/token_og?id=${props.id}`} />
      </Head>
      <Spacer y={3} />
      <div className={tokenStyles.Wrapper}>
        <div className={tokenStyles.TokenDetails}>
          <h1 className={tokenStyles.Name}>
            {props.name} <span>({props.ticker})</span>
          </h1>
          {(props.price !== "--" && (
            <>
              <h1 className={tokenStyles.Price}>
                $
                {props.price.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
              </h1>
              <Spacer y={3.75} />
              <div className={tokenStyles.PeriodMenu}>
                {periods.map((per, i) => (
                  <span
                    key={i}
                    className={
                      selectedPeriod === per ? tokenStyles.Selected : ""
                    }
                    onClick={() => setSelectedPeriod(per)}
                  >
                    {per}
                  </span>
                ))}
              </div>
              <Spacer y={1.5} />
              <div className={tokenStyles.Graph}>
                {history && (
                  <Line
                    data={{
                      labels: history.map(({ date }) => date),
                      datasets: [
                        {
                          data: history.map(({ price }) => price),
                          ...GraphDataConfig,
                          borderColor:
                            theme === "Light" ? "#000000" : "#ffffff",
                        },
                      ],
                    }}
                    options={GraphOptions({
                      theme,
                      tooltipText: ({ value }) =>
                        `${Number(value).toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2,
                        })} AR`,
                    })}
                  />
                )}
              </div>
              <Spacer y={1.5} />
            </>
          )) || <Spacer y={3.75} />}
          <h1 className="Title">About</h1>
          <Spacer y={1} />
          <p className={tokenStyles.Paragraph}>
            {state?.settings?.communityDescription ||
              (state && "No community description available...") || (
                <>
                  <Loading.Skeleton
                    style={{
                      width: "100%",
                      marginBottom: ".5em",
                      height: "1.35em",
                    }}
                  />
                  <Loading.Skeleton
                    style={{
                      width: "100%",
                      marginBottom: ".5em",
                      height: "1.35em",
                    }}
                  />
                  <Loading.Skeleton
                    style={{
                      width: "100%",
                      marginBottom: ".5em",
                      height: "1.35em",
                    }}
                  />
                  <Loading.Skeleton
                    style={{ width: "85%", height: "1.35em" }}
                  />
                </>
              )}
          </p>
          <Spacer y={1.8} />
          <h1 className="Title">Metrics</h1>
          <Spacer y={1} />
          <p className={tokenStyles.Paragraph}>
            {(metrics && (
              <>
                Market Cap: ~${metrics.marketCap.toLocaleString()} USD
                <br />
                Circulating Supply: {metrics.circulatingSupply.toLocaleString()}{" "}
                {props.ticker}
                <br />
                Total Supply: {metrics.totalSupply.toLocaleString()}{" "}
                {props.ticker}
              </>
            )) || (
              <>
                <Loading.Skeleton
                  style={{
                    width: "36%",
                    marginBottom: ".5em",
                    height: "1.35em",
                  }}
                />
                <Loading.Skeleton
                  style={{
                    width: "36%",
                    marginBottom: ".5em",
                    height: "1.35em",
                  }}
                />
                <Loading.Skeleton style={{ width: "36%", height: "1.35em" }} />
              </>
            )}
          </p>
          <Spacer y={1.8} />
          <h1 className="Title">Links</h1>
          <Spacer y={1} />
          <p className={tokenStyles.Paragraph}>
            <ul>
              {state?.settings?.communityAppUrl && (
                <li>
                  <a
                    href={state.settings.communityAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {state.settings.communityAppUrl.replace(
                      /(http(s?)):\/\//,
                      ""
                    )}
                  </a>
                </li>
              )}
              {state && (
                <li>
                  <a
                    href={`https://community.xyz/#${props.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    community.xyz/{props.name.toLowerCase()}
                  </a>
                </li>
              )}
              {state?.settings?.communityDiscussionLinks &&
                state?.settings?.communityDiscussionLinks.map((url, i) => (
                  <li key={i}>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      {url.replace(/(http(s?)):\/\//, "")}
                    </a>
                  </li>
                ))}
            </ul>
            {!state?.settings && (
              <>
                <Loading.Skeleton
                  style={{
                    width: "28%",
                    marginBottom: ".5em",
                    height: "1.35em",
                  }}
                />
                <Loading.Skeleton
                  style={{
                    width: "28%",
                    marginBottom: ".5em",
                    height: "1.35em",
                  }}
                />
                <Loading.Skeleton style={{ width: "28%", height: "1.35em" }} />
              </>
            )}
          </p>
        </div>
        <Card className={tokenStyles.ActionCard}>
          <Input
            label="Address"
            placeholder="Transfer target..."
            {...target.bindings}
          />
          <Spacer y={1.2} />
          <Input
            label="Amount"
            placeholder="2000"
            type="number"
            {...amount.bindings}
            inlineLabel={props.ticker}
          />
          <Spacer y={2.8} />
          <Button
            onClick={transfer}
            style={{ width: "100%" }}
            loading={transferring}
          >
            Transfer
          </Button>
          <Spacer y={1.3} />
          <Button type="outlined" style={{ width: "100%" }} onClick={goToSwap}>
            Swap
          </Button>
        </Card>
      </div>
    </>
  );
};

const Art = (props: PropTypes) => {
  const [fullScreen, setFullScreen] = useState(false);
  const [arPrice, setArPrice] = useState("--");
  const previewEl = useRef<HTMLDivElement>();
  const theme = useTheme();

  useEffect(() => {
    (async () => {
      const price = await client.getPrice(props.id);
      setArPrice(
        price?.price?.toLocaleString(undefined, {
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
    axios
      .get(`https://v2.cache.verto.exchange/${props.id}`)
      .then(({ data }) => {
        let state = data.state;
        if (state.settings)
          state.settings = Object.fromEntries(new Map(state.settings));

        setState(state);
      });
  }, []);

  const [userData, setUserData] = useState<UserData>();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data } = await axios.get(
        `https://v2.cache.verto.exchange/site/artwork/${props.id}`
      );

      setUserData({
        name: data.owner.name,
        usertag: data.owner.username,
        avatar: data.owner.image ?? randomEmoji(),
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

  return (
    <>
      <Head>
        <title>Verto - {props.name}</title>
        <Metas title={props.name} image={`https://arweave.net/${props.id}`} />
      </Head>
      <Spacer y={3} />
      <h1 className={artStyles.Title}>{props.name}</h1>
      <Spacer y={3.75} />
      <div
        className={
          artStyles.Layout +
          " " +
          (fullScreen ? artStyles.FullScreenLayout : "")
        }
        ref={previewEl}
      >
        <Card className={artStyles.Preview}>
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
          <div className={artStyles.Actions}>
            {tokenType === "video" && (
              <button
                onClick={() => setVideoMuted((val) => !val)}
                className={artStyles.Octicon}
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
        <Card className={artStyles.Form}>
          <div>
            <p className={artStyles.FormTitle}>Lowest price:</p>
            <h1 className={artStyles.Price}>
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
              <span className={artStyles.FormTitle}>/share (~{arPrice})</span>
            </h1>
            <Spacer y={0.85} />
            <Avatar
              {...userData}
              style={{ cursor: "pointer" }}
              onClick={() => router.push(`/@${userData.usertag}`)}
              className={artStyles.Avatar}
            />
            <Spacer y={0.85} />
            <p className={artStyles.FormTitle}>Description</p>
            <p style={{ textAlign: "justify" }}>
              {state?.settings?.communityDescription || "No description."}
            </p>
          </div>
          <div>
            <Button className={artStyles.FormBtn}>Buy</Button>
            <Spacer y={0.85} />
            <Button className={artStyles.FormBtn} type="outlined">
              Sell
            </Button>
          </div>
        </Card>
        {fullScreen && (
          <>
            {(tokenType === "image" && (
              <img
                src={`https://arweave.net/${props.id}`}
                alt="art"
                className={artStyles.FullScreenPreview}
                draggable={false}
              />
            )) ||
              ((tokenType === "video" || tokenType === "audio") && (
                <video
                  controls={tokenType === "audio"}
                  muted={videoMuted}
                  autoPlay
                  className={artStyles.FullScreenPreview}
                >
                  <source
                    src={`https://arweave.net/${props.id}`}
                    type={contentType}
                  />
                </video>
              ))}
            <div
              className={
                artStyles.Actions +
                " " +
                (theme === "Dark" ? artStyles.ActionsDark : "")
              }
            >
              {tokenType === "video" && (
                <button
                  onClick={() => setVideoMuted((val) => !val)}
                  className={artStyles.Octicon}
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
      <Spacer y={3} />
      <h1 className="Title">History</h1>
      <Spacer y={3} />
      <Card.ArtActivity
        type="buy"
        user={{
          avatar: "https://th8ta.org/marton.jpeg",
          usertag: "martonlederer",
          name: "Marton Lederer",
        }}
        timestamp={new Date()}
        price={{ usd: 1204.768548, ar: 300.43256424 }}
        orderID="WE5dJ4BenAiBbjs8zs8EWAsOo33gjwadsfa7ntxVLVc"
      />
      <Spacer y={3} />
    </>
  );
};

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: "blocking",
  };
}

export async function getStaticProps({ params: { id } }) {
  const {
    data: { state },
  } = await axios.get(`https://v2.cache.verto.exchange/${id}`);
  const res = await client.getPrice(id);
  const {
    data: { type },
  } = await axios.get(`http://v2.cache.verto.exchange/site/type/${id}`);

  const { data: gecko } = await axios.get(
    "https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=usd"
  );

  return {
    props: {
      id,
      name: state.name,
      ticker: state.ticker,
      price: res ? res.price * gecko.arweave.usd : "--",
      type: type || "community",
    },
    revalidate: 1,
  };
}

export default Token;
