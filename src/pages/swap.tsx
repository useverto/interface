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
import { opacityAnimation } from "../utils/animations";
import Balance from "../components/Balance";
import Head from "next/head";
import Metas from "../components/Metas";
import useArConnect from "use-arconnect";
import useGeofence from "../utils/geofence";
import styles from "../styles/views/swap.module.sass";

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
  const [orderType, setOrderType] = useState<OrderType>("limit");

  // token selector type ("from", "to" or hidden = undefined)
  const [tokenSelector, setTokenSelector] = useState<
    "from" | "to" | undefined
  >();

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
              </motion.div>
            )}
          </AnimatePresence>
          <div className={styles.SwapWrapper}>
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
              {(orderType === "market" && (
                <>
                  <p>
                    Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                    Iste voluptate ex provident dolores quae? Ad vero totam,
                    enim beatae porro, vel quibusdam asperiores blanditiis
                    voluptatem delectus, eius veritatis natus a!
                  </p>
                </>
              )) || (
                <>
                  <p>
                    Aliquid esse quidem ipsum alias possimus sunt reprehenderit
                    hic quisquam, eius similique dignissimos voluptate error
                    repellendus libero ducimus laudantium eos quo minima.
                  </p>
                </>
              )}
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
      <h1 className="Title">
        Orderbook
        <Select label="DEPTH" small className={styles.DepthSelect}>
          <option value="0">0</option>
        </Select>
      </h1>
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
