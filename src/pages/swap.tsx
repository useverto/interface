import {
  OrderInterfaceWithPair,
  UserInterface,
} from "@verto/js/dist/common/faces";
import {
  Button,
  Page,
  Select,
  Spacer,
  useModal,
  Modal,
  useTheme,
  Card,
  useInput,
  Loading,
} from "@verto/ui";
import { useEffect, useState } from "react";
import { permissions as requiredPermissions } from "../utils/arconnect";
import { GraphDataConfig, GraphOptions } from "../utils/graph";
import { AnimatePresence, motion } from "framer-motion";
import { Line } from "react-chartjs-2";
import {
  ChevronDownIcon,
  CloseCircleIcon,
  InformationIcon,
} from "@iconicicons/react";
import { OrderType } from "../utils/order";
import {
  cardListAnimation,
  expandAnimation,
  opacityAnimation,
} from "../utils/animations";
import { useMediaPredicate } from "react-media-hook";
import {
  fetchTokenStateMetadata,
  fetchTopCommunities,
  PaginatedToken,
  UserBalance,
} from "verto-cache-interface";
import { gateway, isAddress, verto } from "../utils/arweave";
import { useSelector } from "react-redux";
import { RootState } from "../store/reducers";
import { formatAddress } from "../utils/format";
import { swapItems } from "../utils/storage_names";
import SwapInput from "../components/SwapInput";
import Balance from "../components/Balance";
import Head from "next/head";
import Metas from "../components/Metas";
import useArConnect from "use-arconnect";
import useGeofence from "../utils/geofence";
import axios from "axios";
import InfiniteScroll from "react-infinite-scroll-component";
import usePaginatedTokens from "../utils/paginated_tokens";
import OrderBookRow from "../components/OrderBookRow";
import styles from "../styles/views/swap.module.sass";

const Swap = ({
  defaultPair,
}: {
  defaultPair: { from: SimpleTokenInterface; to: SimpleTokenInterface };
}) => {
  // arconnect helper
  const arconnect = useArConnect();

  // a modal to ask for missing permissions from the
  // Arweave wallet extension
  const permissionModal = useModal(false);

  // check if the user has the required permissions
  useEffect(() => {
    (async () => {
      // return if the wallet is not yet initialised
      if (!window.arweaveWallet) return;

      const allowed = await window.arweaveWallet.getPermissions();

      // loop through required permissions
      for (const permission of requiredPermissions) {
        if (allowed.includes(permission)) continue;
        // if the permission is missing, open the modal
        permissionModal.setState(true);
      }
    })();
  }, [arconnect]);

  // display theme
  const theme = useTheme();

  // geofence
  const blockedCountry = useGeofence();

  // type of the order that the user will submit
  const [orderType, setOrderType] = useState<OrderType>("market");

  // token selector type ("from", "to" or hidden = undefined)
  const [tokenSelector, setTokenSelector] = useState<
    "from" | "to" | undefined
  >();

  // input for the token amount sent
  const amountInput = useInput<number>(undefined);

  // input for the price for one
  const priceInput = useInput<number>(undefined);

  // is the device size = mobile
  const mobile = useMediaPredicate("(max-width: 720px)");

  // the currently selected token pair
  const [pair, setPair] = useState<{
    from: SimpleTokenInterface;
    to: SimpleTokenInterface;
  }>(defaultPair);

  // load the last used token pair
  useEffect(() => {
    (async () => {
      const pairStorageVal = localStorage.getItem(swapItems);

      // return if nothing is stored
      if (!pairStorageVal) return;

      const parsedPair: { from: string; to: string } = JSON.parse(
        pairStorageVal
      );

      // return if the parsed pair is invalid
      if (!isAddress(parsedPair.from) || !isAddress(parsedPair.to)) return;

      // load token metadata to set as the pair
      const fromToken = await fetchTokenStateMetadata(parsedPair.from);
      const toToken = await fetchTokenStateMetadata(parsedPair.to);

      // set pair
      setPair({
        from: {
          id: fromToken.id,
          name: fromToken.name,
          ticker: fromToken.ticker,
        },
        to: {
          id: toToken.id,
          name: toToken.name,
          ticker: toToken.ticker,
        },
      });
    })();
  }, []);

  // save the current pair to load later
  useEffect(() => {
    localStorage.setItem(
      swapItems,
      JSON.stringify({
        from: pair.from.id,
        to: pair.to.id,
      })
    );
  }, [pair]);

  // orderbook for the current pair
  const [orderbook, setOrderbook] = useState<OrderInterfaceWithPair[]>();

  useEffect(() => {
    (async () => {
      // TODO
      /*setOrderbook(
        await verto.exchange.getOrderBook([pair.from.id, pair.to.id])
      );*/
    })();
  }, []);

  // load tokens to token selector
  const { tokens, hasMore, fetchMore, animationCounter } = usePaginatedTokens();

  useEffect(() => {
    fetchMore();
  }, []);

  // load balances
  const [balances, setBalances] = useState<BalanceType[]>([]);
  const [loadingBalances, setLoadingBalances] = useState(true);
  const address = useSelector((state: RootState) => state.addressReducer);

  type BalanceType = UserBalance & {
    useContractLogo: boolean;
  };

  useEffect(() => {
    (async () => {
      if (!address) return;
      setBalances([]);
      setLoadingBalances(true);

      try {
        const fetchedBalances = await verto.user.getBalances(address);

        // load logos
        for (const balance of fetchedBalances) {
          const { status } = await axios.get(
            verto.token.getLogo(balance.contractId)
          );

          setBalances((val) => [
            ...val,
            {
              ...balance,
              useContractLogo:
                balance.type === "community" &&
                status !== 200 &&
                balance.logo &&
                balance.logo !== balance.contractId,
            },
          ]);
        }
      } catch {}

      setLoadingBalances(false);
    })();
  }, [address]);

  // search
  const tokenSearchInput = useInput("");

  // set token search input value to default
  // when the token selector appears / disappears
  useEffect(() => tokenSearchInput.reset(), [tokenSelector]);

  /**
   * Filter tokens by their name, ticker and finally their ID
   * @param token Token to filter
   */
  function filterTokens(token: BalanceType | PaginatedToken) {
    const query = tokenSearchInput.state.toLowerCase();

    // return true for all if there is no query
    if (!query || query === "") return true;

    // filter using the query
    if (token.name.toLowerCase().includes(query)) return true;
    if (token.ticker.toLowerCase().includes(query)) return true;

    // @ts-expect-error
    const id: string = token?.id || token?.contractId;

    if (query === id.toLowerCase()) return true;

    // return false if none of the above match
    return false;
  }

  /**
   * Sort tokens by their name, ticker and id (compared to the query)
   */
  function sortTokens(
    a: BalanceType | PaginatedToken,
    b: BalanceType | PaginatedToken,
    sortType: "name" | "ticker" | "id"
  ) {
    if (tokenSearchInput.state === "" || !tokenSearchInput.state) return 0;

    const query = new RegExp(tokenSearchInput.state, "gi");

    return (
      (b[sortType].match(query)?.length || 0) -
      (a[sortType].match(query)?.length || 0)
    );
  }

  /**
   * Update pair based on the selected token
   * @param token Token to set as the new pair
   * @param type Type of the token ("from" or "to")
   */
  async function setPairItem(
    token: BalanceType | PaginatedToken,
    type: "from" | "to"
  ) {
    if (tokens.length === 0) await fetchMore();

    setPair((val) => {
      // @ts-expect-error
      const id: string = token.id || token.contractId;
      let updatedPair = {
        ...val,
        [type]: {
          id,
          name: token.name,
          ticker: token.ticker,
        },
      };

      // update "to" token if it is the same as "from" token
      // and do the same for the "from" token
      if (type === "from" && id === pair.to.id) {
        updatedPair.to = {
          id: tokens[0].id,
          name: tokens[0].name,
          ticker: tokens[0].ticker,
        };
      } else if (type === "to" && id === pair.from.id) {
        updatedPair.from = {
          id: balances[0].contractId,
          name: balances[0].name,
          ticker: balances[0].ticker,
        };
      }

      return updatedPair;
    });
    setTokenSelector(undefined);
  }

  // modal that gives information about the order types (market or limit)
  const orderInfoModal = useModal();

  /**
   * Returns the tokens to be sold / owned balance ratio
   */
  function fillPercentage() {
    const amount = amountInput.state ?? 0;
    const owned = balanceOfCurrent();

    return (amount / owned) * 100;
  }

  /**
   * Get the owned balance of the currently selected "from" token
   */
  function balanceOfCurrent() {
    return (
      balances.find(({ contractId }) => contractId === pair.from.id)?.balance ??
      0
    );
  }

  // max btn hovered
  const [maxHovered, setMaxHovered] = useState(false);

  // TODO: to calculate the total amount of tokens the user will receive
  // dry run the contract with the swap interaction

  return (
    <Page>
      <Head>
        <title>Verto - Swap</title>
        <Metas title="Swap" />
      </Head>
      <Spacer y={3} />
      <Balance />
      <Spacer y={4} />
      <div className={styles.SwapContent}>
        <div className={styles.Graph}>
          <Line
            data={{
              // TODO: filterGraphData()
              labels: [
                "2021-12-01",
                "2021-12-02",
                "2021-12-03",
                "2021-12-04",
                "2021-12-05",
                "2021-12-06",
                "2021-12-07",
              ],
              datasets: [
                {
                  // TODO: filterGraphData()
                  // show price of "to" token in "from" tokens
                  data: [0, 1, 2, 2, 4, 3, 2, 4],
                  ...GraphDataConfig,
                  borderColor: theme === "Light" ? "#000000" : "#ffffff",
                },
              ],
            }}
            options={{
              ...GraphOptions({
                theme,
                tooltipText: ({ value }) =>
                  `${Number(value).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })} ${pair.from.ticker}/${pair.to.ticker}`,
              }),
              maintainAspectRatio: false,
            }}
          />
        </div>
        <Card className={styles.SwapForm}>
          {/** If the country is blocked, we display an overlay */}
          <AnimatePresence>
            {blockedCountry && (
              <motion.div
                className={
                  styles.SwapOverlay +
                  " " +
                  styles.BlockedCountry +
                  " " +
                  (theme === "Dark" ? styles.SwapOverlayDark : "")
                }
                {...opacityAnimation()}
              >
                <div>
                  <h1>We do not offer services in your location 😢</h1>
                  <Spacer y={1} />
                  <p>
                    We apologize for the inconvenience but Verto {"&"} th8ta do
                    not currently offer services to users in your country or
                    location.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {tokenSelector && (
              <motion.div
                className={
                  styles.SwapOverlay +
                  " " +
                  (theme === "Dark" ? styles.SwapOverlayDark : "") +
                  " " +
                  styles.SelectToken
                }
                {...opacityAnimation()}
              >
                <h1 className={styles.TokenSelectTitle}>
                  Select Token
                  <CloseCircleIcon
                    className={styles.CloseTokenSelect}
                    onClick={() => setTokenSelector(undefined)}
                  />
                </h1>
                <Spacer y={1.25} />
                {/** TODO: search for "to" tokens (using the search hook of the cache api) */}
                <SwapInput
                  className={styles.SearchToken}
                  {...tokenSearchInput.bindings}
                  placeholder="Search for token or contract address"
                />
                <Spacer y={2} />
                {(tokenSelector === "from" && (
                  <div className={styles.TokenSelectList}>
                    <AnimatePresence>
                      {!loadingBalances &&
                        balances
                          .filter(filterTokens)
                          .sort((a, b) => sortTokens(a, b, "name"))
                          .map((balance, i) => {
                            let image = balance.contractId;

                            // for communities
                            if (balance.type === "community") {
                              if (balance.useContractLogo) {
                                image = `${gateway()}/${balance.logo}`;
                              } else {
                                image = verto.token.getLogo(
                                  balance.contractId,
                                  theme.toLowerCase() as "light" | "dark"
                                );
                              }
                            } else {
                              // for other tokens
                              image = `${gateway()}/${balance.contractId}`;
                            }

                            return (
                              <motion.div {...cardListAnimation(i)} key={i}>
                                <div
                                  className={
                                    styles.TokenItem +
                                    " " +
                                    (pair.from?.id === balance.contractId
                                      ? styles.SelectedToken
                                      : "")
                                  }
                                  // set the active pair "from" token
                                  onClick={() => setPairItem(balance, "from")}
                                >
                                  <img
                                    src={image}
                                    alt="token-icon"
                                    className={
                                      balance.type === "art"
                                        ? styles.ArtPreview
                                        : ""
                                    }
                                  />
                                  <Spacer x={1.25} />
                                  <div>
                                    <h1>{balance.name}</h1>
                                    <p>
                                      <span>{balance.ticker}</span>
                                      {" · "}
                                      {formatAddress(balance.contractId, 16)}
                                    </p>
                                  </div>
                                </div>
                                <Spacer y={0.75} />
                              </motion.div>
                            );
                          })}
                    </AnimatePresence>
                    {loadingBalances && (
                      <Loading.Spinner className={styles.LoadingTokenList} />
                    )}
                  </div>
                )) ||
                  (tokenSelector === "to" && (
                    <InfiniteScroll
                      className={styles.TokenSelectList}
                      dataLength={tokens.length}
                      next={fetchMore}
                      hasMore={hasMore}
                      loader={
                        <Loading.Spinner className={styles.LoadingTokenList} />
                      }
                      style={{ overflow: "unset !important" }}
                      height={300}
                    >
                      <AnimatePresence>
                        {tokens
                          .filter(({ type }) => type !== "collection")
                          .map((token, i) => {
                            let image = token.id;

                            if (token.type === "community") image = token.logo;

                            return (
                              <motion.div
                                {...cardListAnimation(i - animationCounter)}
                                key={i}
                              >
                                <div
                                  className={
                                    styles.TokenItem +
                                    " " +
                                    (pair.to?.id === token.id
                                      ? styles.SelectedToken
                                      : "")
                                  }
                                  // set the active pair "to" token
                                  onClick={() => setPairItem(token, "to")}
                                >
                                  <img
                                    src={
                                      token.type === "community"
                                        ? token.logo
                                        : `${gateway()}/${image}`
                                    }
                                    alt="token-icon"
                                  />
                                  <Spacer x={1.45} />
                                  <div>
                                    <h1>{token.name}</h1>
                                    <p>
                                      <span>{token.ticker}</span>
                                      {" · "}
                                      {formatAddress(token.id, 16)}
                                    </p>
                                  </div>
                                </div>
                                <Spacer y={0.75} />
                              </motion.div>
                            );
                          })}
                      </AnimatePresence>
                    </InfiniteScroll>
                  ))}
              </motion.div>
            )}
          </AnimatePresence>
          <div className={styles.SwapWrapper}>
            <div>
              <div
                className={
                  styles.Head + " " + (theme === "Dark" ? styles.DarkHead : "")
                }
              >
                <div className={styles.HeadText}>
                  I have
                  <div
                    className={styles.Select}
                    onClick={() => setTokenSelector("from")}
                  >
                    <p>{pair.from.ticker}</p>
                    <ChevronDownIcon className={styles.Arrow} />
                  </div>
                </div>
                <div className={styles.HeadText}>
                  I want
                  <div
                    className={styles.Select}
                    onClick={() => setTokenSelector("to")}
                  >
                    <p>{pair.to.ticker}</p>
                    <ChevronDownIcon className={styles.Arrow} />
                  </div>
                </div>
              </div>
              <div className={styles.OrderType}>
                <div className={styles.Selector}>
                  <p
                    className={
                      orderType === "market" ? styles.SelectedOrderType : ""
                    }
                    onClick={() => setOrderType("market")}
                  >
                    Market Order
                  </p>
                  <div className={styles.Separator} />
                  <p
                    className={
                      orderType === "limit" ? styles.SelectedOrderType : ""
                    }
                    onClick={() => setOrderType("limit")}
                  >
                    Limit Order
                  </p>
                </div>
                <div
                  className={styles.OrderTypeInfo}
                  onClick={() => orderInfoModal.setState(true)}
                >
                  <InformationIcon />
                </div>
              </div>
              <div className={styles.SwapInputs}>
                <AnimatePresence>
                  {orderType === "limit" && (
                    <motion.div
                      style={{ overflow: "hidden" }}
                      {...expandAnimation()}
                    >
                      <SwapInput
                        {...priceInput.bindings}
                        rightEl={
                          <p>
                            {pair.to.ticker} / {pair.from.ticker}
                          </p>
                        }
                        type="number"
                      >
                        <p>Price</p>
                      </SwapInput>
                      <Spacer y={2} />
                    </motion.div>
                  )}
                </AnimatePresence>
                <SwapInput
                  {...amountInput.bindings}
                  type="number"
                  rightEl={
                    <p
                      className={styles.Max}
                      onMouseEnter={() => setMaxHovered(true)}
                      onMouseLeave={() => setMaxHovered(false)}
                      onClick={() => amountInput.setState(balanceOfCurrent())}
                    >
                      {maxHovered ? "Max" : pair.from.ticker}
                    </p>
                  }
                >
                  <p>Amount</p>
                </SwapInput>
                <Spacer y={2} />
                <SwapInput
                  value=""
                  type="number"
                  readonly
                  focusTheme
                  rightEl={<p>xxxxxx</p>}
                >
                  <p>Total</p>
                </SwapInput>
              </div>
            </div>
            <div className={styles.SwapBottom}>
              <div className={styles.ProgressBar}>
                <div className={styles.Bar}>
                  <div
                    className={styles.Filled}
                    style={{
                      width: `${fillPercentage()}%`,
                    }}
                  />
                </div>
                {/** 0% */}
                <div
                  className={
                    styles.Circle +
                    " " +
                    (fillPercentage() > 0 ? styles.FilledCircle : "")
                  }
                />
                {/** 25% */}
                <div
                  className={
                    styles.Circle +
                    " " +
                    (fillPercentage() >= 25 ? styles.FilledCircle : "")
                  }
                />
                {/** 50% */}
                <div
                  className={
                    styles.Circle +
                    " " +
                    (fillPercentage() >= 50 ? styles.FilledCircle : "")
                  }
                />
                {/** 75% */}
                <div
                  className={
                    styles.Circle +
                    " " +
                    (fillPercentage() >= 75 ? styles.FilledCircle : "")
                  }
                />
                {/** 100% */}
                <div
                  className={
                    styles.Circle +
                    " " +
                    (fillPercentage() >= 100 ? styles.FilledCircle : "")
                  }
                />
              </div>
              <Spacer y={2} />
              <Button className={styles.SwapButton}>Swap</Button>
            </div>
          </div>
        </Card>
      </div>
      <Spacer y={4} />
      <div className={"Title " + styles.OrderBookTitle}>
        <h1>
          Orderbook
          <span className={styles.PairTitle}>
            {pair.from.ticker} / {pair.to.ticker}
          </span>
        </h1>
        <Select label="DEPTH" small className={styles.DepthSelect}>
          <option value="0">0</option>
        </Select>
      </div>
      <Spacer y={2} />
      <div className={styles.OrderBook}>
        <Card className={styles.OrderBookCard}>
          <h1>Buy Orders</h1>
          <table>
            <thead>
              <th>Side</th>
              <th>Price ({pair.to.ticker})</th>
              <th>Amount</th>
              <th>Total</th>
            </thead>
            <tbody>
              {orderbook &&
                orderbook
                  .filter((order) => order.pair[0] === pair.from.id)
                  .map((order, i) => (
                    <OrderBookRow
                      key={i}
                      id={i + 1}
                      type="buy"
                      price={order.price}
                      // TODO
                      //amount={order.filled}
                      amount={10}
                      total={order.quantity}
                    />
                  ))}
              {(!orderbook &&
                new Array(5).fill("").map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4}>
                      <Loading.Skeleton className={styles.OrderBookLoading} />
                    </td>
                  </tr>
                ))) ||
                (orderbook.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <p className={styles.NoOrders}>No orders...</p>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Card>
        {mobile && <Spacer y={3.5} />}
        <Card className={styles.OrderBookCard}>
          <h1>Sell Orders</h1>
          <table>
            <thead>
              <th>Side</th>
              <th>Price ({pair.from.ticker})</th>
              <th>Amount</th>
              <th>Total</th>
            </thead>
            <tbody>
              {orderbook &&
                orderbook
                  .filter((order) => order.pair[1] === pair.to.id)
                  .map((order, i) => (
                    <OrderBookRow
                      key={i}
                      id={i + 1}
                      type="sell"
                      price={order.price}
                      // TODO
                      // amount={order.filled}
                      amount={10}
                      total={order.quantity}
                    />
                  ))}
              {(!orderbook &&
                new Array(5).fill("").map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4}>
                      <Loading.Skeleton className={styles.OrderBookLoading} />
                    </td>
                  </tr>
                ))) ||
                (orderbook.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <p className={styles.NoOrders}>No orders...</p>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Card>
      </div>
      <Spacer y={2} />
      <Modal {...permissionModal.bindings}>
        <Modal.Title>Missing permissions</Modal.Title>
        <Modal.Content className={styles.ModalContentJustify}>
          A few permissions are missing. These are necessary for swapping to
          work. Please allow them below.
          <Spacer y={1.5} />
          <Button
            onClick={async () => {
              try {
                await window.arweaveWallet.connect(requiredPermissions, {
                  name: "Verto",
                });
                permissionModal.setState(false);
              } catch {}
            }}
            small
            style={{ margin: "0 auto" }}
          >
            Allow
          </Button>
        </Modal.Content>
      </Modal>
      <Modal {...orderInfoModal.bindings}>
        <Modal.Title>Orders</Modal.Title>
        <Modal.Content
          className={styles.ModalContentJustify + " " + styles.OrderModal}
        >
          <h3 className={styles.ModalTitleInner}>Market Orders</h3>
          Placing an order "at the market" will execute as quickly as possible.
          It will loop through all orders until the submitted order is filled.
          If the order is not completely filled, it will be executed the next
          time someone creates an order against it.
          <h3 className={styles.ModalTitleInner}>Limit Orders</h3>
          Placing an order "at the limit" will execute once an order is created
          that matches the limit price. It will not execute if the limit price
          is not met.
        </Modal.Content>
      </Modal>
    </Page>
  );
};

export async function getStaticProps() {
  const topCommunities: SimpleTokenInterface[] = (
    await fetchTopCommunities(2)
  ).map((val) => ({
    // mapping out redundant data
    id: val.id,
    name: val.name,
    ticker: val.ticker,
  }));

  return {
    props: {
      defaultPair: {
        from: topCommunities[0],
        to: topCommunities[1],
      },
    },
    revalidate: 1,
  };
}

export default Swap;

export type ExtendedUserInterface = UserInterface & { baseAddress: string };
export type SimpleTokenInterface = {
  id: string;
  name: string;
  ticker: string;
};
