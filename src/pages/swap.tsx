import {
  BalanceInterface,
  SwapInterface,
  TokenInterface,
  UserInterface,
} from "@verto/js/dist/faces";
import {
  Button,
  Card,
  Input,
  Page,
  Select,
  Spacer,
  useSelect,
  Loading,
  useToasts,
  useInput,
  useModal,
  Modal,
  useTheme,
} from "@verto/ui";
import { useEffect, useState } from "react";
import { randomEmoji } from "../utils/user";
import { formatAddress } from "../utils/format";
import { AnimatePresence, motion } from "framer-motion";
import { cardListAnimation, opacityAnimation } from "../utils/animations";
import { ArrowSwitchIcon } from "@primer/octicons-react";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  InformationIcon,
} from "@iconicicons/react";
import { Line } from "react-chartjs-2";
import { GraphDataConfig, GraphOptions } from "../utils/graph";
import { client as arweave } from "../utils/arweave";
import { useSelector } from "react-redux";
import { RootState } from "../store/reducers";
import { permissions } from "../utils/arconnect";
import Balance from "../components/Balance";
import Verto from "@verto/js";
import Head from "next/head";
import Link from "next/link";
import Metas from "../components/Metas";
import styles from "../styles/views/swap.module.sass";
import useSWR from "swr";

const client = new Verto();

const Swap = (props: { tokens: TokenInterface[] }) => {
  const { data: tokens } = useSWR("getTokens", () => client.getTokens(), {
    initialData: props.tokens,
  });

  const [post, setPost] = useState("");
  const [posts, setPosts] = useState([]);
  const { setToast } = useToasts();
  const theme = useTheme();

  useEffect(() => {
    (async () => {
      setPosts((await client.getTradingPosts()).map((item) => item.address));
      setPost(await client.recommendPost());
    })();
  }, []);

  const chainsDefaultInputsOutputs = [
    {
      id: "AR",
      name: "AR",
      ticker: "AR",
    },
  ];
  const tokensDefaultInputsOutputs = tokens;
  const [inputs, setInputs] = useState(chainsDefaultInputsOutputs);
  const [outputs, setOutputs] = useState(tokensDefaultInputsOutputs);

  const input = useInput();
  const output = useInput();
  const inputUnit = useSelect<string>("...");
  const outputUnit = useSelect<string>("...");

  const [orders, setOrders] = useState([]);
  const [selectedPST, setSelectedPST] = useState<TokenInterface>();
  const [showAllOrders, setShowAllOrders] = useState(false);

  useEffect(() => {
    if (post && inputUnit.state !== "..." && outputUnit.state !== "...") {
      const id = inputUnit.state === "AR" ? outputUnit.state : inputUnit.state;
      if (inputUnit.state === "AR") {
        setOutputs((val) => {
          setSelectedPST(val.find((item: any) => item.id === id));

          return val;
        });
      } else {
        setInputs((val) => {
          setSelectedPST(val.find((item: any) => item.id === id));

          return val;
        });
      }

      client.getOrderBook(post, id).then((res) => setOrders(res));
    }
  }, [post, inputUnit.state, outputUnit.state]);

  type ExtendedUserInterface = UserInterface & { baseAddress: string };
  const [users, setUsers] = useState<ExtendedUserInterface[]>([]);

  useEffect(() => {
    (async () => {
      setUsers([]);

      for (const order of orders) {
        const user = await client.getUser(order.addr);

        if (user)
          setUsers((val) => [
            ...val.filter(({ baseAddress }) => baseAddress !== order.addr),
            { ...user, baseAddress: order.addr },
          ]);
      }
    })();
  }, [orders]);

  type GraphMode = "price" | "volume";
  const [graphMode, setGraphMode] = useState<GraphMode>("price");
  const [graphData, setGraphData] = useState<
    Record<GraphMode, { [date: string]: number }>
  >({
    price: {},
    volume: {},
  });
  const [loadingGraph, setLoadingGraph] = useState(true);

  useEffect(() => {
    if (!selectedPST || inputUnit.state === "..." || outputUnit.state === "...")
      return;
    (async () => {
      setLoadingGraph(true);
      setGraphData({
        price: await client.getPriceHistory(selectedPST.id),
        volume: await client.getVolumeHistory(selectedPST.id),
      });
      setLoadingGraph(false);
      input.setStatus(undefined);
      output.setStatus(undefined);
    })();
  }, [selectedPST]);

  function switchTokens() {
    const inputVal = { val: inputUnit.state, items: inputs },
      outputVal = { val: outputUnit.state, items: outputs };

    inputUnit.setState(outputVal.val);
    outputUnit.setState(inputVal.val);
    setInputs(outputVal.items);
    setOutputs(inputVal.items);
    input.setStatus(undefined);
    output.setStatus(undefined);
    setToast({
      title: "Switched",
      description: "Switched tokens",
      duration: 3000,
    });
  }

  const [swap, setSwap] = useState<SwapInterface>(null);
  const [creatingSwap, setCreatingSwap] = useState(false);
  const confirmationModal = useModal();
  const currentAddress = useSelector(
    (state: RootState) => state.addressReducer
  );
  const [balances, setBalances] = useState<BalanceInterface[]>([]);

  useEffect(() => {
    (async () => {
      if (!currentAddress) return;
      setBalances(await client.getBalances(currentAddress));
    })();
  }, [currentAddress]);

  const permissionModal = useModal();

  /**
   * Prepare a swap and display confirmation modal
   */
  async function prepareSwap() {
    /**
     * Check if the inputs are valid
     */
    if (input.state === "" || Number(input.state) === 0)
      return input.setStatus("error");

    if (output.state === "" || Number(output.state) === 0)
      return output.setStatus("error");

    if (inputUnit.state === "..." || outputUnit.state === "...") return;

    setCreatingSwap(true);

    try {
      /**
       * Check if the user has enough of the input token
       */
      if (inputUnit.state === "AR") {
        // TODO: check for ETH balance too @johnletey
        // check if AR balance is enough
        const arBalance = parseFloat(
          arweave.ar.winstonToAr(
            await arweave.wallets.getBalance(currentAddress)
          ) ?? "0"
        );

        if (Number(input.state) > arBalance) {
          input.setStatus("error");
          setToast({
            title: "Error",
            description: "Insufficient AR balance",
            type: "error",
            duration: 2700,
          });
          setCreatingSwap(false);
          return;
        }
      } else {
        // check if PST balance is enough
        const pstBalance = balances.find((val) => val.id === selectedPST.id);

        if (Number(input.state) > (pstBalance?.balance ?? 0)) {
          input.setStatus("error");
          setToast({
            title: "Error",
            description: `Insufficient ${selectedPST.ticker} balance`,
            type: "error",
            duration: 2700,
          });
          setCreatingSwap(false);
          return;
        }
      }

      /**
       * Check for permissions
       */
      const allowedPermissions = await window.arweaveWallet.getPermissions();

      for (const perm of permissions)
        if (!allowedPermissions.includes(perm)) {
          setCreatingSwap(false);
          permissionModal.setState(true);
          return;
        }

      /**
       * Create the swap
       */
      setSwap(
        await client.createSwap(
          { amount: Number(input.state), unit: inputUnit.state },
          { amount: Number(output.state), unit: outputUnit.state },
          post
        )
      );
      confirmationModal.setState(true);
      input.setStatus(undefined);
      output.setStatus(undefined);
    } catch {
      setToast({
        title: "Error",
        description: "Could not create swap",
        type: "error",
        duration: 3000,
      });
    }

    setCreatingSwap(false);
  }

  // selected PST price in AR
  const [selectedPrice, setSelectedPrice] = useState(0);

  useEffect(() => {
    if (!selectedPST) return;
    client
      .getPrice(selectedPST.id)
      .then(({ price }) => setSelectedPrice(price));
  }, [selectedPST]);

  // TODO: ETH price
  useEffect(() => {
    if (inputUnit.state !== "AR") return;
    output.setState(Number((selectedPrice * Number(input.state)).toFixed(4)));
  }, [input.state, selectedPrice]);

  // save selected token IDs to local storage
  useEffect(() => {
    if (inputUnit.state === "..." || outputUnit.state === "...") {
      const data = getInputOutput();

      // TODO: ETH
      setOutputs(
        data.output === "AR"
          ? chainsDefaultInputsOutputs
          : tokensDefaultInputsOutputs
      );
      setInputs(
        data.input === "AR"
          ? chainsDefaultInputsOutputs
          : tokensDefaultInputsOutputs
      );

      inputUnit.setState(data.input);
      outputUnit.setState(data.output);
    } else saveInputOutput();
  }, [inputUnit, outputUnit, inputs, outputs]);

  function getInputOutput(): { input: string; output: string } {
    const data = localStorage.getItem("verto_swap_tokens");
    if (!data || !JSON.parse(data)?.val)
      return {
        input: "AR",
        output: tokensDefaultInputsOutputs[0].id,
      };

    const { val: parsed } = JSON.parse(data);

    return {
      input: parsed.input,
      output: parsed.output,
    };
  }

  function saveInputOutput() {
    localStorage.setItem(
      "verto_swap_tokens",
      JSON.stringify({
        val: {
          input: inputUnit.state,
          output: outputUnit.state,
        },
      })
    );
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
          <AnimatePresence>
            <motion.div
              className={styles.GraphMode}
              {...opacityAnimation()}
              key={loadingGraph.toString()}
            >
              {(loadingGraph && <Loading.Spinner />) || (
                <Select
                  small
                  //@ts-ignore
                  onChange={(ev) => setGraphMode(ev.target.value)}
                  // @ts-ignore
                  value={graphMode}
                >
                  <option value="price">Price</option>
                  <option value="volume">Volume</option>
                </Select>
              )}
            </motion.div>
          </AnimatePresence>
          <Line
            data={{
              labels: Object.keys(graphData[graphMode]).reverse(),
              datasets: [
                {
                  data: Object.values(graphData[graphMode]).reverse(),
                  ...GraphDataConfig,
                  borderColor: theme === "Light" ? "#000000" : "#ffffff",
                },
              ],
            }}
            options={{
              ...GraphOptions({
                theme,
                tooltipText: ({ value }) =>
                  graphMode === "price"
                    ? `${Number(value).toFixed(2)} ${selectedPST.ticker}/AR`
                    : `${value} ${selectedPST.ticker}`,
              }),
              maintainAspectRatio: false,
            }}
          />
        </div>
        <Card className={styles.SwapForm}>
          <Input
            label="You send"
            inlineLabel={
              <Select
                {...inputUnit.bindings}
                small
                filled
                className={styles.UnitSelect}
              >
                {inputs.map((input, i) => (
                  <option value={input.id} key={i}>
                    {input.ticker}
                  </option>
                ))}
              </Select>
            }
            type="number"
            className={styles.SwapInput}
            {...input.bindings}
          />
          <Spacer y={1} />
          <div className={styles.SwapLogo} onClick={switchTokens}>
            <ArrowSwitchIcon />
          </div>
          <Input
            label="You recieve"
            inlineLabel={
              <Select
                {...outputUnit.bindings}
                small
                filled
                className={styles.UnitSelect}
              >
                {outputs.map((output, i) => (
                  <option value={output.id} key={i}>
                    {output.ticker}
                  </option>
                ))}
              </Select>
            }
            type="number"
            className={styles.SwapInput}
            {...output.bindings}
            readOnly={inputUnit.state === "AR" || inputUnit.state === "ETH"}
            currency={
              ((inputUnit.state === "AR" || inputUnit.state === "ETH") &&
                "~") ||
              undefined
            }
          />
          <Spacer y={2} />
          <Button
            style={{ width: "100%" }}
            loading={creatingSwap}
            onClick={prepareSwap}
          >
            Swap
          </Button>
        </Card>
      </div>
      <Spacer y={4} />
      <h1 className="Title">
        Orders
        <Select
          label={
            <div className={styles.TradingPostInfo}>
              Trading Post
              <Link href={`/orbit/post/${post}`}>
                <a>
                  <InformationIcon />
                </a>
              </Link>
            </div>
          }
          small
          onChange={(ev) => {
            setPost(ev.target.value);
            setToast({
              title: "Switched post",
              description: "Switched trading post",
              duration: 3000,
            });
          }}
          // @ts-ignore
          value={post}
          className={styles.TradingPostSelect}
        >
          {posts.map((post, i) => (
            <option value={post} key={i}>
              {post.substr(0, 6) + "..."}
            </option>
          ))}
        </Select>
      </h1>
      <Spacer y={2} />
      <AnimatePresence>
        {orders.map((order, i) => {
          const user = users.find((user) =>
            user.addresses.includes(order.addr)
          );

          return (
            (showAllOrders || i < 5) && (
              <motion.div key={order.txID} {...cardListAnimation(i)}>
                <Card.SwapSell
                  user={{
                    avatar:
                      (user?.image && `https://arweave.net/${user.image}`) ||
                      randomEmoji(),
                    usertag: user?.username || order.addr,
                    displaytag: user?.username || formatAddress(order.addr, 10),
                    name: user?.name || undefined,
                  }}
                  selling={{
                    quantity: order.amnt,
                    ticker: selectedPST?.ticker ?? "...",
                  }}
                  rate={1 / order.rate}
                  filled={order.received || 0}
                  orderID={order.txID}
                />
                <Spacer y={i === 4 || i === orders.length - 1 ? 1 : 2} />
              </motion.div>
            )
          );
        })}
      </AnimatePresence>
      <AnimatePresence>
        {orders.length > 5 && (
          <motion.div {...opacityAnimation()}>
            <Spacer y={2} />
            <span
              className="ShowMore"
              onClick={() => setShowAllOrders((val) => !val)}
            >
              Show{" "}
              {(showAllOrders && (
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
        )}
      </AnimatePresence>
      {swap && (
        <Modal {...confirmationModal.bindings} className={styles.ConfirmModal}>
          <Modal.Title>Confirm Order</Modal.Title>
          <Modal.Content>
            <p>Please confirm your order before submitting it:</p>
            <div className={styles.ConfirmSwapItems}>
              <p>{swap.cost.ar} AR</p>
              <div className={styles.SwapIcon}>
                <ArrowSwitchIcon />
              </div>
              {/** TODO */}
              <p>
                {(swap.cost.token &&
                  swap.cost.ar + " " + selectedPST?.ticker) ||
                  "TODO"}
              </p>
            </div>
            <Spacer y={2} />
            <Button small disabled className={styles.SubmitBtn}>
              Submit
            </Button>
          </Modal.Content>
        </Modal>
      )}
      <Modal {...permissionModal.bindings}>
        <Modal.Title>Missing permissions</Modal.Title>
        <Modal.Content style={{ textAlign: "justify" }}>
          A few permissions are missing. These are necessary for swapping to
          work. Please allow them below.
          <Spacer y={1.5} />
          <Button
            onClick={async () => {
              try {
                await window.arweaveWallet.connect(permissions);
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
  const tokens = await client.getTokens();

  return { props: { tokens }, revalidate: 1 };
}

export default Swap;
