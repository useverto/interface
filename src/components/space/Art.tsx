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
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MaximizeIcon,
  MinimizeIcon,
} from "@iconicicons/react";
import { MuteIcon, UnmuteIcon } from "@primer/octicons-react";
import { AnimatePresence, motion } from "framer-motion";
import { UserData } from "@verto/ui/dist/components/Card";
import { TokenType } from "../../utils/user";
import { OrderBookInterface } from "@verto/js/dist/faces";
import { formatAddress } from "../../utils/format";
import { cardListAnimation, opacityAnimation } from "../../utils/animations";
import { run } from "ar-gql";
import { CACHE_URL } from "../../utils/arweave";
import { ExtendedUserInterface } from "../../pages/swap";
import Verto from "@verto/js";
import axios from "axios";
import Head from "next/head";
import Metas from "../../components/Metas";
import marked from "marked";
import useGeofence from "../../utils/geofence";
import styles from "../../styles/views/art.module.sass";

const client = new Verto();

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
                      avatar: userData.image,
                    }
                  : {
                      name: undefined,
                      usertag: order.addr,
                      displaytag: formatAddress(order.addr, 10),
                      avatar: undefined,
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

  const arAmountInput = useInput<number>(0);
  const blockedCountry = useGeofence();

  useEffect(() => {
    if (view === "buy") arAmountInput.setState(bitsPrice.ar);
  }, [bitsPrice.ar]);

  const [loading, setLoading] = useState(false);
  const { setToast } = useToasts();

  async function order(mode: "buy" | "sell") {
    if (blockedCountry)
      return setToast({
        description: "Your country is limited",
        type: "error",
        duration: 4000,
      });

    if (
      (bitsAmountInput.state <= 0 || bitsAmountInput.state > bitsAvailable) &&
      mode === "buy"
    )
      return bitsAmountInput.setStatus("error");

    if (
      (bitsAmountInput.state <= 0 || bitsAmountInput.state > ownedAmount) &&
      mode === "sell"
    )
      return bitsAmountInput.setStatus("error");

    setLoading(true);

    try {
      const swap = await client.createSwap(
        {
          amount: bitsAmountInput.state,
          unit: mode === "buy" ? "AR" : props.id,
        },
        {
          amount: mode === "buy" ? undefined : arAmountInput.state,
          unit: mode === "buy" ? props.id : "AR",
        },
        await client.recommendPost()
      );

      try {
        await client.sendSwap(swap.transactions);

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
                  disabled={!address || bitsAvailable === 0}
                >
                  Buy
                </Button>
                <Spacer y={0.85} />
                <Button
                  className={styles.FormBtn}
                  type="outlined"
                  onClick={() => setView("sell")}
                  disabled={!address || ownedAmount === 0}
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
                  value={bitsPrice.usd}
                  inlineLabel="USD"
                />
                <Spacer y={1.25} />
                {view === "buy" && (
                  <>
                    <p className={styles.FormTitle}>
                      {bitsAvailable} bits available from {sellingBits.length}{" "}
                      orders
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
                                undefined,
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
      <div className={styles.Bits}>
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
        <p className={styles.NoSale}>No bits on sale</p>
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

interface PropTypes {
  id: string;
  name: string;
  ticker: string;
  price: number | "--";
  type?: TokenType;
}

export default Art;
