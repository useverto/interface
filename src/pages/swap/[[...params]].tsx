import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import {
  ClobContractStateInterface,
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
  useToasts,
} from "@verto/ui";
import { useEffect, useState } from "react";
import { permissions as requiredPermissions } from "../../utils/arconnect";
import { GraphDataConfig, GraphOptions } from "../../utils/graph";
import { AnimatePresence, motion } from "framer-motion";
import { Line } from "react-chartjs-2";
import {
  ChevronDownIcon,
  CloseCircleIcon,
  InformationIcon,
} from "@iconicicons/react";
import { OrderType } from "../../utils/order";
import {
  cardListAnimation,
  expandAnimation,
  opacityAnimation,
} from "../../utils/animations";
import { useMediaPredicate } from "react-media-hook";
import {
  fetchContract,
  fetchTokenStateMetadata,
  fetchTopCommunities,
  PaginatedToken,
  UserBalance,
} from "verto-cache-interface";
import {
  CLOB_CONTRACT,
  gateway,
  gatewayConfig,
  isAddress,
  supportsFCP,
  verto,
} from "../../utils/arweave";
import { useSelector } from "react-redux";
import { RootState } from "../../store/reducers";
import { formatAddress, isNanNull } from "../../utils/format";
import { swapItems } from "../../utils/storage_names";
import { pairAddPending } from "../../utils/pending_pair";
import SwapInput from "../../components/SwapInput";
import Balance from "../../components/Balance";
import Head from "next/head";
import Metas from "../../components/Metas";
import useArConnect from "use-arconnect";
import useGeofence from "../../utils/geofence";
import axios from "axios";
import InfiniteScroll from "react-infinite-scroll-component";
import usePaginatedTokens from "../../utils/paginated_tokens";
import OrderBookRow from "../../components/OrderBookRow";
import styles from "../../styles/views/swap.module.sass";

const Swap = ({ defaultPair, overwrite }: Props) => {
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

  // wether the pair is currently loaded or not
  // this is needed so that the ui doesn't try to load
  // wether the pair is added or not to the order book
  // more than once
  const [loadingPair, setLoadingPair] = useState(true);

  // load the last used token pair
  useEffect(() => {
    (async () => {
      setLoadingPair(true);

      const pairStorageVal = localStorage.getItem(swapItems);

      // return if nothing is stored
      if (!pairStorageVal) return;

      const parsedPair: { from: string; to: string } =
        JSON.parse(pairStorageVal);

      // return if the parsed pair is invalid
      if (!isAddress(parsedPair.from) || !isAddress(parsedPair.to)) return;

      // if the pair items are the same
      // update one of them to a random one
      if (
        parsedPair.from === parsedPair.to ||
        (parsedPair.from === pair.to.id && overwrite.to && !overwrite.from) ||
        (parsedPair.to === pair.from.id && overwrite.from && !overwrite.to) ||
        (pair.from.id === pair.to.id && overwrite.from && overwrite.to)
      ) {
        parsedPair.to = (await fetchTopCommunities(1))[0].id;
        overwrite.to = false;
      }

      // load token metadata to set as the pair
      const fromToken = overwrite.from
        ? pair.from
        : await fetchTokenStateMetadata(parsedPair.from);
      const toToken = overwrite.to
        ? pair.to
        : await fetchTokenStateMetadata(parsedPair.to);

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
      setLoadingPair(false);
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
      // set orderbook to undefined to show loading
      setOrderbook(undefined);

      // fetch orderbook
      const currentOrderbook = await verto.exchange.getOrderBook([
        pair.from.id,
        pair.to.id,
      ]);

      setOrderbook(currentOrderbook);

      // set the order type to "limit" if the
      // orderbook for this pair is empty
      setOrderType(currentOrderbook.length === 0 ? "limit" : "market");
    })();
  }, [pair]);

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

  // load clob contract
  const [clobContractState, setClobContractState] =
    useState<ClobContractStateInterface>();

  useEffect(() => {
    fetchContract(CLOB_CONTRACT)
      .then((res) => setClobContractState(res.state))
      .catch();
  }, []);

  // wether the pair is tradable or not
  const [tradablePair, setTradablePair] = useState(false);

  // if current pair doesn't exist, create it
  const pairModal = useModal();
  const [pairExists, setPairExists] = useState(true);

  useEffect(() => {
    (async () => {
      if (
        !clobContractState ||
        !tradablePair ||
        loadingPair ||
        !pair.from?.id ||
        !pair.to?.id
      )
        return;

      const pairInContract = !!clobContractState.pairs.find(
        ({ pair: existingPair }) =>
          existingPair.includes(pair.from.id) &&
          existingPair.includes(pair.to.id)
      );

      // return if the CLOB state already includes the pair
      if (pairInContract) return setPairExists(true);

      /**
       * Check if there is already an interaction, that has
       * not yet been mined and what tries to add the current pair.
       * This is necessary to notify the user that the pair is already
       * being added, but that the transaction is still pending.
       */
      const foundPairAddInteraction = await pairAddPending([
        pair.from.id,
        pair.to.id,
      ]);
      setPairExists(foundPairAddInteraction);

      pairModal.setState(!pairModal.state && !foundPairAddInteraction);
    })();
  }, [pair, clobContractState, tradablePair, loadingPair]);

  // loading add pair
  const [addPairLoading, setAddPairLoading] = useState(false);

  /**
   * Attempt to add the current pair to the CLOB contract
   */
  async function addPair() {
    setAddPairLoading(true);

    try {
      await verto.exchange.addPair([pair.from.id, pair.to.id]);

      setToast({
        type: "success",
        description: "Created pair",
        duration: 3000,
      });
    } catch (e) {
      console.error(
        "Error adding pair: \n",
        "Message: ",
        e,
        "\n",
        "Stack: \n",
        "Pair: \n",
        JSON.stringify(pair, null, 2),
        "\n",
        "Error: ",
        e
      );
      setToast({
        type: "error",
        description: "Failed to create pair",
        duration: 3700,
      });
    }

    setAddPairLoading(false);
    pairModal.setState(false);
    setPairExists(true);
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

  // toasts
  const { setToast } = useToasts();

  /**
   * Validate the given datas before creating the order
   */
  function validateOrder() {
    amountInput.setStatus(undefined);
    priceInput.setStatus(undefined);

    const amount = Number(amountInput.state);
    const price = Number(priceInput.state);
    let valid = true;

    // validate price if limit order
    if (orderType === "limit" && (Number.isNaN(price) || price <= 0)) {
      priceInput.setStatus("error");
      setToast({
        type: "error",
        description: `Invalid price of ${pair.to.ticker}/${pair.from.ticker}`,
        duration: 3300,
      });
      valid = false;
    }

    // validate amount type
    if (Number.isNaN(amount) || amount <= 0) {
      amountInput.setStatus("error");
      setToast({
        type: "error",
        description: `Invalid amout of ${pair.from.ticker}`,
        duration: 3300,
      });
      valid = false;
    }

    // check if the user has enough balance
    if (balanceOfCurrent() < amountInput.state) {
      amountInput.setStatus("error");
      setToast({
        type: "error",
        description: `You don't have enough ${pair.from.ticker} tokens to sell`,
        duration: 3300,
      });
      valid = false;
    }

    return valid;
  }

  // button loading state
  const [loading, setLoading] = useState(false);

  /**
   * Create the order
   */
  async function swap() {
    if (!validateOrder() || loading || !tradablePair) return;

    setLoading(true);

    try {
      const amount = Number(amountInput.state);
      const price =
        orderType === "limit" ? Number(priceInput.state) : undefined;

      // create the order
      await verto.exchange.swap(
        {
          from: pair.from.id,
          to: pair.to.id,
        },
        amount,
        price
      );

      setToast({
        type: "success",
        description:
          "Order created successfully. Your funds will arrive shortly",
        duration: 3800,
      });
      setToast({
        type: "info",
        description: `Your estimated receipt is ${
          (estimate.immediate ?? 0) + (estimate.rest ?? 0)
        } ${pair.to.ticker}`,
        duration: 3800,
      });
      priceInput.reset();
      amountInput.reset();
    } catch (e) {
      console.error(
        "Error creating order: \n",
        "Message: ",
        e,
        "\n",
        "Stack: \n",
        "Order type ",
        orderType,
        "\n",
        "Pair: \n",
        JSON.stringify(pair, null, 2),
        "\n",
        "Amount: ",
        amountInput.state,
        "\n",
        "Price (if order is a limit order): ",
        priceInput.state
      );
      setToast({
        type: "error",
        description: "Could not create order",
        duration: 3400,
      });
    }

    setLoading(false);
  }

  // tradable validation
  // if one of the tokens in the pair does not support the FCP
  // Verto cannot create a swap between them
  useEffect(() => {
    (async () => {
      setLoading(true);

      try {
        // load the state of the tokens in the pair
        const { state: fromState } = await fetchContract(pair.from.id);
        const { state: toState } = await fetchContract(pair.to.id);

        // if both are supported, the pair is tradable
        const isTradablePair = supportsFCP(fromState) && supportsFCP(toState);

        setTradablePair(isTradablePair);
        if (!isTradablePair) {
          setToast({
            type: "warning",
            description:
              "This pair is not tradable. One of the tokens does not support the FCP",
            duration: 3300,
          });
        }
      } catch (e) {
        console.error("Error fetching pair states: \n", e);
        setToast({
          description: "Unable to verify the pair's tradability",
          type: "error",
          duration: 3000,
        });
      }

      setLoading(false);
    })();
  }, [pair]);

  // estimate the received token amount
  const [estimate, setEstimate] = useState<{
    immediate: number;
    rest: number;
    remaining: number;
    fee: number;
  }>({
    immediate: 0,
    rest: 0,
    remaining: 0,
    fee: 0,
  });

  useEffect(() => {
    (async () => {
      if (!amountInput.state) return;

      // get price
      let price = orderType === "limit" ? Number(priceInput.state) : undefined;

      // if the price is undefined for limit orders, set it to 0
      if (orderType === "limit" && isNaN(price)) price = 0;

      // fetch estimate
      const res = await verto.exchange.estimateSwap(
        {
          from: pair.from.id,
          to: pair.to.id,
        },
        Number(amountInput.state),
        price
      );

      setEstimate(res);
    })();
  }, [pair, orderType, amountInput.state, priceInput.state]);

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
            {/** TODO: re-enable this on MAINNET release */}
            {/*blockedCountry && (
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
            )*/}
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
                          // TODO: sort by balance
                          .sort((a, b) => b.balance - a.balance)
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
                                  onClick={() => setPairItem(balance, "from")}
                                  title={
                                    balance?.balance
                                      ? balance?.balance?.toLocaleString(
                                          undefined,
                                          { maximumFractionDigits: 2 }
                                        ) +
                                        " " +
                                        balance.ticker
                                      : undefined
                                  }
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
                            let image = token.logo;

                            if (token.type === "community") {
                              // overwrite crytometa logo url with theme
                              if (image.includes("viewblock") || !image) {
                                image = verto.token.getLogo(
                                  token.id,
                                  theme.toLowerCase() as "light" | "dark"
                                );
                              }
                            } else {
                              image = `${gateway()}/${token.id}`;
                            }

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
                                  <img src={image} alt="token-icon" />
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
                    className={[
                      (orderType === "market" && styles.SelectedOrderType) ||
                        "",
                      (orderbook &&
                        orderbook.length === 0 &&
                        styles.DisabledOrderType) ||
                        "",
                    ]
                      .filter((val) => val !== "")
                      .join(" ")}
                    onClick={() => {
                      // return if the orderbook has no orders yet
                      if (orderbook && orderbook.length === 0) return;
                      setOrderType("market");
                    }}
                    title={
                      (orderbook &&
                        orderbook.length === 0 &&
                        "A first order for a pair always has to be a limit order.") ||
                      undefined
                    }
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
                        min={0}
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
                  min={0}
                  max={balanceOfCurrent()}
                >
                  <p>Amount</p>
                </SwapInput>
                <Spacer y={2.4} />
                {(orderType === "limit" && (
                  <>
                    <div className={styles.Estimate}>
                      <p>Estimated immediate</p>
                      <p>
                        ≈ {isNanNull(estimate.immediate)} {pair.to.ticker}
                      </p>
                    </div>
                    <Spacer y={0.65} />
                    <div className={styles.Estimate}>
                      <p>Remains</p>
                      <p>
                        ≈ {isNanNull(estimate.rest)} {pair.to.ticker}
                      </p>
                    </div>
                  </>
                )) || (
                  <div className={styles.Estimate}>
                    <p>Returns</p>
                    <p>
                      ≈ {isNanNull(estimate.remaining)} {pair.from.ticker}
                    </p>
                  </div>
                )}
                <Spacer y={0.65} />
                <div className={styles.Estimate}>
                  <p>Fee</p>
                  <p>
                    {isNanNull(estimate.fee)} {pair.from.ticker}
                  </p>
                </div>
                <Spacer y={0.8} />
                <div className={styles.Estimate + " " + styles.Total}>
                  <p>Total estimated</p>
                  <p>
                    ≈{" "}
                    {isNanNull(estimate.immediate) +
                      isNanNull(estimate.rest || 0)}{" "}
                    {pair.to.ticker}
                  </p>
                </div>
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
              <Button
                className={styles.SwapButton}
                onClick={() => {
                  if (pairExists) {
                    swap();
                  } else {
                    pairModal.setState(true);
                  }
                }}
                loading={loading || loadingPair}
                disabled={!tradablePair || loading || loadingPair}
              >
                Swap
              </Button>
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
        {/*<Select label="DEPTH" small className={styles.DepthSelect}>
          <option value="0">0</option>
        </Select>*/}
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
              <th className={styles.TotalColumn}>Total</th>
              <th className={styles.CancelColumn} />
            </thead>
            <tbody>
              {(() => {
                // if orderbook is not loaded
                if (!orderbook)
                  return (
                    <>
                      {new Array(5).fill("").map((_, i) => (
                        <tr key={i}>
                          <td colSpan={5}>
                            <Loading.Skeleton
                              className={styles.OrderBookLoading}
                            />
                          </td>
                        </tr>
                      ))}
                    </>
                  );

                // get buy orders
                const buyOrders = orderbook.filter(
                  (order) => order.token === pair.from.id
                );

                if (buyOrders.length === 0)
                  return (
                    <tr>
                      <td colSpan={5}>
                        <p className={styles.NoOrders}>No buy orders...</p>
                      </td>
                    </tr>
                  );
                else
                  return (
                    <>
                      {buyOrders.map((order, i) => (
                        <OrderBookRow
                          key={i}
                          index={i + 1}
                          orderID={order.id}
                          type="buy"
                          price={order.price}
                          amount={order.quantity}
                          total={order.originalQuantity}
                          cancellable={order.creator === address}
                        />
                      ))}
                    </>
                  );
              })()}
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
              <th className={styles.TotalColumn}>Total</th>
              <th className={styles.CancelColumn} />
            </thead>
            <tbody>
              {(() => {
                // if orderbook is not loaded
                if (!orderbook)
                  return (
                    <>
                      {new Array(5).fill("").map((_, i) => (
                        <tr key={i}>
                          <td colSpan={5}>
                            <Loading.Skeleton
                              className={styles.OrderBookLoading}
                            />
                          </td>
                        </tr>
                      ))}
                    </>
                  );

                // get sell orders
                const sellOrders = orderbook.filter(
                  (order) => order.token === pair.to.id
                );

                if (sellOrders.length === 0)
                  return (
                    <tr>
                      <td colSpan={5}>
                        <p className={styles.NoOrders}>No sell orders...</p>
                      </td>
                    </tr>
                  );
                else
                  return (
                    <>
                      {sellOrders.map((order, i) => (
                        <OrderBookRow
                          key={i}
                          index={i + 1}
                          orderID={order.id}
                          type="sell"
                          price={order.price}
                          amount={order.quantity}
                          total={order.originalQuantity}
                          cancellable={order.creator === address}
                        />
                      ))}
                    </>
                  );
              })()}
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
                await window.arweaveWallet.connect(
                  requiredPermissions,
                  {
                    name: "Verto",
                  },
                  gatewayConfig
                );
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
          If the order is not completely filled, the remaining amount will be
          sent back to the order creator.
          <h3 className={styles.ModalTitleInner}>Limit Orders</h3>
          Placing an order "at the limit" will execute once an order is created
          that matches the limit price. It will not execute if the limit price
          is not met.
        </Modal.Content>
      </Modal>
      <Modal {...pairModal.bindings}>
        <Modal.Title>Add Pair</Modal.Title>
        <Modal.Content className={styles.ModalContentJustify}>
          <div className={styles.PairChip}>
            {pair.from.ticker}/{pair.to.ticker}
          </div>{" "}
          is not yet added to the Orderbook contract. Do you want to add it now?
          <Spacer y={1.5} />
          <Button
            small
            style={{ margin: "0 auto" }}
            onClick={addPair}
            loading={addPairLoading}
          >
            Add
          </Button>
        </Modal.Content>
      </Modal>
    </Page>
  );
};

export async function getServerSideProps({
  query,
}: GetServerSidePropsContext): Promise<GetServerSidePropsResult<Props>> {
  const params =
    (query?.params && {
      from: typeof query.params === "string" ? query.params : query.params[0],
      to: typeof query.params === "string" ? undefined : query.params[1],
    }) ||
    {};

  const defaultPair: {
    from: SimpleTokenInterface;
    to: SimpleTokenInterface;
  } = {
    from: undefined,
    to: undefined,
  };

  // fetch from token if defined
  if (params?.from && isAddress(params.from)) {
    try {
      defaultPair.from = await fetchTokenStateMetadata(params.from);
    } catch {}
  }

  // fetch to token if defined
  if (params?.to && isAddress(params.to)) {
    try {
      defaultPair.to = await fetchTokenStateMetadata(params.to);
    } catch {}
  }

  // if to and from are defined, return props
  if (defaultPair.from && defaultPair.to) {
    return {
      props: {
        defaultPair,
        overwrite: {
          from: true,
          to: true,
        },
      },
    };
  }

  // if only one or none is defined, we return the top communities
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
        from: defaultPair.from ?? topCommunities[0],
        to: defaultPair.to ?? topCommunities[1],
      },
      // overwrite locally storaged pair or not
      overwrite: {
        from: !!defaultPair.from,
        to: !!defaultPair.to,
      },
    },
  };
}

export default Swap;

interface Props {
  defaultPair: {
    from: SimpleTokenInterface;
    to: SimpleTokenInterface;
  };
  overwrite: {
    from: boolean;
    to: boolean;
  };
}

export type ExtendedUserInterface = UserInterface & { baseAddress: string };
export type SimpleTokenInterface = {
  id: string;
  name: string;
  ticker: string;
};
