import { UserInterface } from "@verto/js/dist/faces";
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
import { expandAnimation, opacityAnimation } from "../utils/animations";
import { useMediaPredicate } from "react-media-hook";
import SwapInput from "../components/SwapInput";
import Balance from "../components/Balance";
import Head from "next/head";
import Metas from "../components/Metas";
import useArConnect from "use-arconnect";
import useGeofence from "../utils/geofence";
import styles from "../styles/views/swap.module.sass";
import OrderBookRow from "../components/OrderBookRow";

const Swap = () => {
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

  // the token search input controller
  const tokenSearchInput = useInput("");

  // set token search input value to default
  // when the token selector appears / disappears
  useEffect(() => tokenSearchInput.reset(), [tokenSelector]);

  // input for the token amount sent
  const amountInput = useInput<number>(0);

  // input for the price for one
  const priceInput = useInput<number>(0);

  // is the device size = mobile
  const mobile = useMediaPredicate("(max-width: 720px)");

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
            {/** If the token selector is not undefined, we display the token selector overlay */}
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
                <SwapInput {...tokenSearchInput.bindings}>
                  <p>Search for token or contract address</p>
                </SwapInput>
                <Spacer y={2} />
                <div className={styles.TokenSelectList}>
                  <div className={styles.TokenItem}>
                    <img
                      src="https://verto.exchange/logo_light.svg"
                      alt="token-icon"
                    />
                    <Spacer x={1.25} />
                    <div>
                      <h1>Verto</h1>
                      <p>
                        <span>VRT</span> · ljeWncmsS...WLsnwqp
                      </p>
                    </div>
                  </div>
                  <Spacer y={0.75} />
                </div>
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
                    <p>Ardrive</p>
                    <ChevronDownIcon className={styles.Arrow} />
                  </div>
                </div>
                <div className={styles.HeadText}>
                  I want
                  <div
                    className={styles.Select}
                    onClick={() => setTokenSelector("to")}
                  >
                    <p>VRT</p>
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
                        <p>VRT / ARDRIVE</p>
                      </SwapInput>
                      <Spacer y={2} />
                    </motion.div>
                  )}
                </AnimatePresence>
                <SwapInput {...amountInput.bindings} extraPadding>
                  <p>Amount</p>
                  <p style={{ textTransform: "uppercase" }}>Ardrive</p>
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
          <span className={styles.PairTitle}>ARDRIVE / VRT</span>
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
              <th>Price (VRT)</th>
              <th>Amount</th>
              <th>Total</th>
            </thead>
            <tbody>
              <OrderBookRow
                id={1}
                type="buy"
                price={1.63}
                amount={2048}
                total={2200}
              />
              <OrderBookRow
                id={2}
                type="buy"
                price={1.63}
                amount={2048}
                total={3338.4}
              />
              <OrderBookRow
                id={3}
                type="buy"
                price={1.63}
                amount={2048}
                total={2550}
              />
              <OrderBookRow
                id={4}
                type="buy"
                price={1.63}
                amount={1300}
                total={2000}
              />
              <OrderBookRow
                id={5}
                type="buy"
                price={1.63}
                amount={3310}
                total={3310}
              />
              <OrderBookRow
                id={6}
                type="buy"
                price={1.63}
                amount={2048}
                total={3338.4}
              />
              <OrderBookRow
                id={7}
                type="buy"
                price={1.63}
                amount={2048}
                total={3011.2}
              />
              <OrderBookRow
                id={8}
                type="buy"
                price={1.63}
                amount={2048}
                total={2422}
              />
            </tbody>
          </table>
        </Card>
        {mobile && <Spacer y={3.5} />}
        <Card className={styles.OrderBookCard}>
          <h1>Sell Orders</h1>
          <table>
            <thead>
              <th>Side</th>
              <th>Price (ARDRIVE)</th>
              <th>Amount</th>
              <th>Total</th>
            </thead>
            <tbody>
              <OrderBookRow
                id={1}
                type="sell"
                price={1.63}
                amount={2048}
                total={2200}
              />
              <OrderBookRow
                id={2}
                type="sell"
                price={1.63}
                amount={2048}
                total={3338.4}
              />
              <OrderBookRow
                id={3}
                type="sell"
                price={1.63}
                amount={2048}
                total={2550}
              />
              <OrderBookRow
                id={4}
                type="sell"
                price={1.63}
                amount={1300}
                total={2000}
              />
              <OrderBookRow
                id={5}
                type="sell"
                price={1.63}
                amount={3310}
                total={3310}
              />
              <OrderBookRow
                id={6}
                type="sell"
                price={1.63}
                amount={2048}
                total={3338.4}
              />
              <OrderBookRow
                id={7}
                type="sell"
                price={1.63}
                amount={2048}
                total={3011.2}
              />
              <OrderBookRow
                id={8}
                type="sell"
                price={1.63}
                amount={2048}
                total={2422}
              />
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
  return { props: {}, revalidate: 1 };
}

export default Swap;
export type ExtendedUserInterface = UserInterface & { baseAddress: string };
