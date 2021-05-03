import { TokenInterface, UserInterface } from "@verto/js/dist/faces";
import {
  Button,
  Card,
  Input,
  Page,
  Select,
  Spacer,
  useSelect,
} from "@verto/ui";
import { useEffect, useState } from "react";
import { randomEmoji } from "../utils/user";
import { formatAddress } from "../utils/format";
import { AnimatePresence, motion } from "framer-motion";
import { cardListAnimation, opacityAnimation } from "../utils/animations";
import {
  ArrowSwitchIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@primer/octicons-react";
import Balance from "../components/Balance";
import Verto from "@verto/js";
import Head from "next/head";
import Metas from "../components/Metas";
import styles from "../styles/views/swap.module.sass";

const client = new Verto();

const Swap = (props: { tokens: TokenInterface[] }) => {
  const [post, setPost] = useState("");
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    (async () => {
      setPosts((await client.getTradingPosts()).map((item) => item.address));
      setPost(await client.recommendPost());
    })();
  }, []);

  const [inputs, setInputs] = useState([
    {
      id: "AR",
      name: "AR",
      ticker: "AR",
    },
  ]);
  const [outputs, setOutputs] = useState(props.tokens);

  const inputUnit = useSelect("AR");
  const outputUnit = useSelect(props.tokens[0].id);

  const [orders, setOrders] = useState([]);
  const [ticker, setTicker] = useState("");
  const [showAllOrders, setShowAllOrders] = useState(false);

  useEffect(() => {
    if (post) {
      const id = inputUnit.state === "AR" ? outputUnit.state : inputUnit.state;
      if (inputUnit.state === "AR") {
        setOutputs((val) => {
          setTicker(val.find((item: any) => item.id === id).ticker);

          return val;
        });
      } else {
        setInputs((val) => {
          setTicker(val.find((item: any) => item.id === id).ticker);

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
        <div className={styles.Graph}></div>
        <Card className={styles.SwapForm}>
          <Input
            label="You send"
            inlineLabel={
              <Select {...inputUnit.bindings} small filled>
                {inputs.map((input, i) => (
                  <option value={input.id} key={i}>
                    {input.ticker}
                  </option>
                ))}
              </Select>
            }
            type="number"
            style={{ width: "calc(100% - 6px)" }}
          />
          <Spacer y={1} />
          <div className={styles.SwapLogo}>
            <ArrowSwitchIcon />
          </div>
          <Input
            label="You recieve"
            inlineLabel={
              <Select {...outputUnit.bindings} small filled>
                {outputs.map((output, i) => (
                  <option value={output.id} key={i}>
                    {output.ticker}
                  </option>
                ))}
              </Select>
            }
            type="number"
            style={{ width: "calc(100% - 6px)" }}
          />
          <Spacer y={2} />
          <Button style={{ width: "100%" }}>Swap</Button>
        </Card>
      </div>
      <Spacer y={4} />
      <h1 className="Title">
        Orders
        <Select
          label="Trading Post"
          small
          onChange={(ev) => setPost(ev.target.value)}
          // @ts-ignore
          value={post}
          className={styles.TradingPostSelect}
        >
          {posts.map((post) => (
            <option value={post}>{post.substr(0, 6) + "..."}</option>
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
              <motion.div key={i} {...cardListAnimation(i)}>
                <Card.SwapSell
                  user={{
                    avatar:
                      (user?.image && `https://arweave.net/${user.image}`) ||
                      randomEmoji(),
                    usertag: user?.username || formatAddress(order.addr, 10),
                    name: user?.name || undefined,
                  }}
                  selling={{ quantity: order.amnt, ticker }}
                  rate={1 / order.rate}
                  filled={order.received || 0}
                  orderID={order.txID}
                />
                <Spacer y={1} />
              </motion.div>
            )
          );
        })}
      </AnimatePresence>
      <AnimatePresence>
        {orders.length > 5 && (
          <motion.div {...opacityAnimation()}>
            <Spacer y={1} />
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
    </Page>
  );
};

export async function getServerSideProps() {
  const tokens = await client.getTokens();

  return { props: { tokens } };
}

export default Swap;
