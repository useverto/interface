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
  fetchPaginated,
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
  const amountInput = useInput<number>(0);

  // input for the price for one
  const priceInput = useInput<number>(0);

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
  const [tokens, setTokens] = useState<PaginatedToken[]>([]);
  const [currentTokensPage, setCurrentTokensPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchMore();
  }, []);

  // fetch all tokens paginated
  async function fetchMore() {
    if (!hasMore) return;

    const fetchedTokens = await fetchPaginated<PaginatedToken>(
      "tokens",
      8,
      currentTokensPage
    );

    // if there are not tokens returned, quit
    if (fetchedTokens.isEmpty()) return setHasMore(false);
    else {
      // get if there is a next page
      const hasNextPage = fetchedTokens.hasNextPage();

      setHasMore(hasNextPage);
      setTokens((val) => [...val, ...fetchedTokens.items]);

      // if there is a next page, update the page counter
      if (hasNextPage) setCurrentTokensPage((val) => val + 1);
    }
  }

  // load balances
  const [balances, setBalances] = useState<BalanceType[]>([]);
  const address = useSelector((state: RootState) => state.addressReducer);

  type BalanceType = UserBalance & {
    useContractLogo: boolean;
  };

  useEffect(() => {
    (async () => {
      if (!address) return;
      setBalances([]);

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
  function setPairItem(
    token: BalanceType | PaginatedToken,
    type: "from" | "to"
  ) {
    setPair((val) => ({
      ...val,
      [type]: {
        // @ts-expect-error
        id: token.id || token.contractId,
        name: token.name,
        ticker: token.ticker,
        logo: token.logo,
      },
    }));
    setTokenSelector(undefined);
  }

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
                  })} ${
                    /*selectedPST.ticker + (graphMode === "price" ? "/AR" : "")*/
                    ""
                  }`,
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
                <SwapInput
                  className={styles.SearchToken}
                  {...tokenSearchInput.bindings}
                >
                  <p>Search for token or contract address</p>
                </SwapInput>
                <Spacer y={2} />
                {(tokenSelector === "from" && (
                  <div className={styles.TokenSelectList}>
                    {balances
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
                              className={styles.TokenItem}
                              // set the active pair "from" token
                              onClick={() => setPairItem(balance, "from")}
                            >
                              <img src={image} alt="token-icon" />
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
                          </motion.div>
                        );
                      })}
                  </div>
                )) ||
                  (tokenSelector === "to" && (
                    <div className={styles.TokenSelectList}>
                      <div className={styles.TokenItem}>
                        <img
                          src="https://verto.exchange/logo_light.svg"
                          alt="token-icon"
                        />
                        <Spacer x={1.45} />
                        <div>
                          <h1>Verto</h1>
                          <p>
                            <span>VRT</span> · ljeWncmsS...WLsnwqp
                          </p>
                        </div>
                      </div>
                      <Spacer y={0.75} />
                    </div>
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
                <div className={styles.OrderTypeInfo}>
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
                        extraPadding={{ right: "8.6em", left: "6em" }}
                      >
                        <p>Price</p>
                        <p>
                          {pair.to.ticker} / {pair.from.ticker}
                        </p>
                      </SwapInput>
                      <Spacer y={2} />
                    </motion.div>
                  )}
                </AnimatePresence>
                <SwapInput {...amountInput.bindings} extraPadding>
                  <p>Amount</p>
                  <p style={{ textTransform: "uppercase" }}>
                    {pair.from.ticker}
                  </p>
                </SwapInput>
                <Spacer y={2} />
                <SwapInput value="" extraPadding readonly focusTheme>
                  <p>Total</p>
                  <p>xxxxxx</p>
                </SwapInput>
              </div>
            </div>
            <div className={styles.SwapBottom}>
              <div className={styles.ProgressBar}>
                <div className={styles.Bar}>
                  <div className={styles.Filled} style={{ width: "50%" }} />
                </div>
                <div className={styles.Circle + " " + styles.FilledCircle} />
                <div className={styles.Circle + " " + styles.FilledCircle} />
                <div className={styles.Circle + " " + styles.FilledCircle} />
                <div className={styles.Circle} />
                <div className={styles.Circle} />
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
              {!orderbook &&
                new Array(5).fill("").map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4}>
                      <Loading.Skeleton className={styles.OrderBookLoading} />
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
              {!orderbook &&
                new Array(5).fill("").map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4}>
                      <Loading.Skeleton className={styles.OrderBookLoading} />
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
        <Modal.Content style={{ textAlign: "justify" }}>
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
