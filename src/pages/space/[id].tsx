import {
  Avatar,
  Button,
  Card,
  Input,
  Loading,
  Page,
  Popover,
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
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MaximizeIcon,
  MinimizeIcon,
  TrashIcon,
  PlusIcon,
} from "@iconicicons/react";
import { MuteIcon, UnmuteIcon } from "@primer/octicons-react";
import { AnimatePresence, motion } from "framer-motion";
import { UserData } from "@verto/ui/dist/components/Card";
import { fixUserImage, randomEmoji, TokenType } from "../../utils/user";
import { OrderBookInterface, UserInterface } from "@verto/js/dist/faces";
import { formatAddress } from "../../utils/format";
import {
  cardAnimation,
  cardListAnimation,
  opacityAnimation,
} from "../../utils/animations";
import { run } from "ar-gql";
import { CACHE_URL } from "../../utils/arweave";
import { ExtendedUserInterface } from "../swap";
import Verto from "@verto/js";
import axios from "axios";
import Head from "next/head";
import Metas from "../../components/Metas";
import dayjs from "dayjs";
import tokenStyles from "../../styles/views/token.module.sass";
import artStyles from "../../styles/views/art.module.sass";
import collectionStyles from "../../styles/views/collection.module.sass";

const client = new Verto();

interface PropTypes {
  id: string;
  name: string;
  ticker: string;
  price: number | "--";
  type?: TokenType;
}

const Token = (props) => {
  // TODO: custom layout

  return (
    <Page>
      {(props.type === "community" && <Community {...props} />) ||
        (props.type === "collection" && <Collection {...props} />) || (
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
    axios.get(`${CACHE_URL}/${props.id}`).then(({ data }) => {
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
              state?.description ||
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
            placeholder="Recipient..."
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

  // TODO(@johnletey): SWR ...

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
    axios.get(`${CACHE_URL}/${props.id}`).then(({ data }) => {
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
      const { data } = await axios.get(`${CACHE_URL}/site/artwork/${props.id}`);

      setUserData({
        name: data.owner.name,
        usertag: data.owner.username,
        avatar: data.owner.image
          ? `https://arweave.net/${data.owner.image}`
          : randomEmoji(),
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

  type HistoryItem = OrderBookInterface & {
    user: UserData;
  };

  const [orderBook, setOrderBook] = useState<HistoryItem[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    (async () => {
      const tradingPosts = await client.getTradingPosts();

      for (const post of tradingPosts) {
        const orders = await client.getOrderBook(post.address, props.id);
        const history = await Promise.all(
          orders.map(
            async (order): Promise<HistoryItem> => {
              const userData = await client.getUser(order.addr);

              return {
                ...order,
                user: userData
                  ? {
                      name: userData.name,
                      usertag: userData.username,
                      avatar: userData.image ?? randomEmoji(),
                    }
                  : {
                      name: undefined,
                      usertag: order.addr,
                      displaytag: formatAddress(order.addr, 10),
                      avatar: randomEmoji(),
                    },
              };
            }
          )
        );

        setOrderBook((val) => [...val, ...history]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!userData) return;
      const listTx = (
        await run(
          `
        query($id: ID!) {
          transactions(ids: [$id]) {
            edges {
              node {
                block {
                  timestamp
                }
              }
            }
          }
        }
      `,
          {
            id: props.id,
          }
        )
      ).data.transactions.edges[0];

      const listAction: HistoryItem = {
        txID: props.id,
        amnt: parseFloat(listTx?.node.quantity?.ar ?? "0"),
        addr: "",
        type: "list",
        createdAt: listTx?.node.block.timestamp ?? 0,
        received: 0,
        user: userData,
      };

      setOrderBook((val) => [...val, listAction]);
    })();
  }, [userData]);

  interface BitsInterface {
    quantity: number;
    priceAr: number;
    priceUSD: number;
  }

  const [sellingBits, setSellingBits] = useState<BitsInterface[]>([]);

  useEffect(() => {
    (async () => {
      const tradingPosts = await client.getTradingPosts();
      let bits: BitsInterface[] = [];

      for (const post of tradingPosts) {
        const orders = await client.getOrderBook(post.address, props.id);

        bits = [
          ...bits,
          ...orders.map((order) => ({
            quantity: order.amnt,
            priceAr: order.rate,
            priceUSD: order.rate * arRate,
          })),
        ];
      }

      setSellingBits(bits);
    })();
  }, [arRate]);

  const [view, setView] = useState<"preview" | "buy" | "sell">("preview");

  useEffect(() => setShowAll(false), [view]);

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

  const [bitsAvailable, setBitsAvailable] = useState(0);

  useEffect(() => {
    let bitsOnSale = 0;

    for (const bit of sellingBits) bitsOnSale += bit.quantity;

    setBitsAvailable(bitsOnSale);
  }, [sellingBits]);

  const [price, setPrice] = useState(0);
  const [bitsPrice, setBitsPrice] = useState({
    usd: 0,
    ar: 0,
  });

  useEffect(() => {
    client.getPrice(props.id).then(({ price }) => setPrice(price ?? 0));
  }, []);

  useEffect(() => {
    setBitsPrice({
      usd: price * bitsAmountInput.state * arRate,
      ar: price * bitsAmountInput.state,
    });
  }, [price, bitsAmountInput.state]);

  const [ownedAmount, setOwnedAmount] = useState(0);
  const address = useSelector((state: RootState) => state.addressReducer);

  useEffect(() => {
    if (!address) return;
    (async () => {
      const balances = await client.getBalances(address);
      setOwnedAmount(balances.find(({ id }) => id === props.id)?.balance ?? 0);
    })();
  }, [address]);

  const [users, setUsers] = useState<ExtendedUserInterface[]>([]);

  useEffect(() => {
    (async () => {
      setUsers([]);

      for (const order of orderBook) {
        const user = await client.getUser(order.addr);

        if (user)
          setUsers((val) => [
            ...val.filter(({ baseAddress }) => baseAddress !== order.addr),
            { ...user, baseAddress: order.addr },
          ]);
      }
    })();
  }, [orderBook]);

  const [loading, setLoading] = useState(false);
  const { setToast } = useToasts();

  async function order(mode: "buy" | "sell") {
    if (
      bitsAmountInput.state <= 0 &&
      bitsAmountInput.state > bitsAvailable &&
      mode === "buy"
    )
      return bitsAmountInput.setStatus("error");

    if (
      bitsAmountInput.state <= 0 &&
      bitsAmountInput.state > ownedAmount &&
      mode === "sell"
    )
      return bitsAmountInput.setStatus("error");

    setLoading(true);

    // TODO: remove disabled from buy/sell buttons after this is ready

    try {
      // TODO: create swap
      /**
      const swapItem = await client.createSwap(
        { amount: Number(input.state), unit: inputUnit.state },
        {
          amount: inputUnit.state === "AR" ? undefined : Number(output.state),
          unit: outputUnit.state,
        },
        await client.recommendPost()
      );
      */

      try {
        // TODO: submit swap

        setToast({
          description: "Your order has been submitted",
          type: "success",
          duration: 4500,
        });
      } catch {
        setToast({
          description: "Error submitting your order",
          type: "error",
          duration: 4500,
        });
      }
    } catch {
      setToast({
        description: "Error creating your order",
        type: "error",
        duration: 4500,
      });
    }

    setLoading(false);
    bitsAmountInput.setStatus(undefined);
  }

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
          {(view === "preview" && (
            <>
              <div>
                <p className={artStyles.FormTitle}>Last price:</p>
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
                  <span className={artStyles.FormTitle}>/bit (~{arPrice})</span>
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
                  {state?.description ||
                    state?.settings?.communityDescription ||
                    "No description."}
                </p>
              </div>
              <div>
                <Button
                  className={artStyles.FormBtn}
                  onClick={() => setView("buy")}
                  // disabled={!address || bitsAvailable === 0}
                  // TODO: remove disabled below
                  disabled
                >
                  Buy
                </Button>
                <Spacer y={0.85} />
                <Button
                  className={artStyles.FormBtn}
                  type="outlined"
                  onClick={() => setView("sell")}
                  // disabled={!address || ownedAmount === 0}
                  // TODO: remove disabled below
                  disabled
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
                  max={view === "sell" ? ownedAmount : bitsAvailable}
                  min={0}
                />
                <Spacer y={1.25} />
                <Input
                  readOnly
                  currency="$"
                  type="number"
                  value={bitsPrice.usd}
                  inlineLabel="USD"
                />
                <Spacer y={1.25} />
                <Input
                  readOnly
                  type="number"
                  value={bitsPrice.ar}
                  inlineLabel="AR"
                />
                <Spacer y={1.25} />
                {view === "buy" && (
                  <>
                    <p className={artStyles.FormTitle}>
                      {bitsAvailable} bits available from {sellingBits.length}{" "}
                      orders
                      <br />
                      {totalSupply} bits in total
                    </p>
                    <Spacer y={1.25} />
                  </>
                )}
              </div>
              {(view === "buy" && (
                <div>
                  <Button
                    className={artStyles.FormBtn}
                    onClick={() => order("buy")}
                    loading={loading}
                  >
                    Add to collection
                  </Button>
                  <Spacer y={0.85} />
                  <Button
                    className={artStyles.FormBtn}
                    type="secondary"
                    onClick={() => {
                      if (loading) return;
                      setView("preview");
                    }}
                  >
                    Back
                  </Button>
                </div>
              )) || (
                <div>
                  <Button
                    className={artStyles.FormBtn}
                    onClick={() => order("sell")}
                    loading={loading}
                  >
                    Sell bits
                  </Button>
                  <Spacer y={0.85} />
                  <Button
                    className={artStyles.FormBtn}
                    type="secondary"
                    onClick={() => {
                      if (loading) return;
                      setView("preview");
                    }}
                  >
                    Back
                  </Button>
                </div>
              )}
            </>
          )}
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
      <Spacer y={4.5} />
      <h1 className="Title">
        {(view === "preview" && "History") || "Available bits"}
      </h1>
      <Spacer y={3} />
      <AnimatePresence>
        {view === "preview" &&
          orderBook
            .sort((a, b) => b.createdAt - a.createdAt)
            .map(
              (order, i) =>
                (showAll || i < 3) && (
                  <motion.div key={i} {...cardListAnimation(i)}>
                    {/** TODO: map activities */}
                    {(order.type === "list" && (
                      <Card.ArtActivity
                        key={i}
                        // @ts-ignore
                        type={order.type}
                        user={order.user}
                        timestamp={new Date(order.createdAt * 1000)}
                        price={{ usd: order.amnt * arRate, ar: order.amnt }}
                        orderID={order.txID}
                      />
                    )) ||
                      (() => {
                        const user = users.find((user) =>
                          user.addresses.includes(order.addr)
                        );

                        return (
                          <Card.SwapSell
                            user={{
                              avatar:
                                (user?.image &&
                                  `https://arweave.net/${user.image}`) ||
                                randomEmoji(),
                              usertag: user?.username || order.addr,
                              // @ts-ignore
                              displaytag:
                                user?.username || formatAddress(order.addr, 10),
                              name: user?.name || undefined,
                            }}
                            selling={{
                              quantity: order.amnt,
                              ticker: props.ticker,
                            }}
                            rate={1 / order.rate}
                            filled={order.received || 0}
                            orderID={order.txID}
                          />
                        );
                      })()}
                    <Spacer y={i === 2 || i === orderBook.length - 1 ? 1 : 2} />
                  </motion.div>
                )
            )}
      </AnimatePresence>
      <div className={artStyles.Bits}>
        <AnimatePresence>
          {(view === "buy" || view === "sell") &&
            sellingBits.map((bit, i) => (
              <motion.div key={i} {...cardListAnimation(i)}>
                <Card.Bits {...bit} />
                <Spacer y={i === 2 || i === orderBook.length - 1 ? 1 : 2} />
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
      {sellingBits.length === 0 && view !== "preview" && (
        <p className={artStyles.NoSale}>No bits on sale</p>
      )}
      <AnimatePresence>
        {(view === "preview" && orderBook.length > 3 && (
          <motion.div {...opacityAnimation()}>
            <Spacer y={2} />
            <span
              className="ShowMore"
              onClick={() => setShowAll((val) => !val)}
            >
              Show{" "}
              {(showAll && (
                <>
                  less
                  <ChevronUpIcon />
                </>
              )) || (
                <>
                  all
                  <ChevronDownIcon />
                </>
              )}
            </span>
          </motion.div>
        )) || <Spacer y={2} />}
      </AnimatePresence>
    </>
  );
};

interface CollectionProps {
  id: string;
  name: string;
  description: string;
  collaborators: string[];
  owner: UserInterface;
  items: string[];
  type: "collection";
}

const Collection = ({
  id,
  name,
  description,
  collaborators,
  items,
}: CollectionProps) => {
  const [collaboratorUsers, setCollaboratorUsers] = useState<UserInterface[]>(
    []
  );
  const activeAddress = useSelector((state: RootState) => state.addressReducer);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const users: UserInterface[] = [];

      for (const addr of collaborators) {
        const user = await client.getUser(addr);

        if (user && !users.find(({ username }) => username === user.username)) {
          users.push(fixUserImage(user));
        } else if (!user && !users.find(({ username }) => username === addr)) {
          users.push({
            username: addr,
            name: "",
            addresses: [addr],
            image: randomEmoji(),
          });
        }
      }

      setCollaboratorUsers(users);
    })();
  }, [collaborators]);

  const [creator, setCreator] = useState<string>();

  useEffect(() => {
    (async () => {
      const { data } = await run(
        `
        query($id: ID!) {
          transaction(id: $id) {
            owner {
              address
            }
          }
        }      
      `,
        { id }
      );

      setCreator(data.transaction.owner.address);
    })();
  }, [id]);

  return (
    <>
      <Head>
        <title>Verto - {name}</title>
        <Metas title={name} subtitle={description} />
      </Head>
      <Spacer y={3} />
      <h1 className={"Title " + collectionStyles.Title}>{name}</h1>
      <Spacer y={0.3} />
      <p className={collectionStyles.Subtitle}>{description}</p>
      <Spacer y={0.42} />
      <div
        className={
          collectionStyles.Collaborators +
          " " +
          (activeAddress === creator ? collectionStyles.EditCollaborators : "")
        }
      >
        <AnimatePresence>
          {collaboratorUsers.map((user, i) => (
            <motion.div
              className={collectionStyles.Collaborator}
              key={i}
              {...opacityAnimation(i)}
            >
              <img src={user.image} draggable={false} alt="U" />
              {!user.addresses.includes(activeAddress) && (
                <div
                  className={collectionStyles.Remove}
                  onClick={() => {
                    if (activeAddress !== creator) return;
                    setCollaboratorUsers((val) =>
                      val.filter((u) => u.username !== user.username)
                    );
                  }}
                >
                  <TrashIcon />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div className={collectionStyles.Collaborator}>
          <Popover
            content={<>TODO</>}
            position="right"
            style={{ cursor: "auto" }}
          >
            <PlusIcon className={collectionStyles.AddCollaborator} />
          </Popover>
        </div>
      </div>
      <Spacer y={3} />
      <div className={collectionStyles.Items}>
        <AnimatePresence>
          {collaboratorUsers.length > 0 &&
            items.map((id, i) => (
              <motion.div
                className={collectionStyles.Item}
                {...cardAnimation(i)}
                key={i}
              >
                <Card.AssetClear
                  image={`https://arweave.net/${id}`}
                  onClick={() => router.push(`/space/${id}`)}
                />
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
      {activeAddress === creator && (
        <>
          <Spacer y={2.5} />
          <p className={collectionStyles.AddNew}>Add new</p>
        </>
      )}
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
    data: { type },
  } = await axios.get(`${CACHE_URL}/site/type/${id}`);

  if (type === "collection") {
    const { data } = await axios.get(`${CACHE_URL}/site/collection/${id}`);

    return {
      props: {
        ...data,
        type: "collection",
      },
      revalidate: 1,
    };
  } else {
    const {
      data: { state },
    } = await axios.get(`${CACHE_URL}/${id}`);
    const res = await client.getPrice(id);

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
}

export default Token;
