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
import { ChevronDownIcon, InformationIcon } from "@iconicicons/react";
import { OrderType } from "../utils/order";
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

  const [orderType, setOrderType] = useState<OrderType>("limit");

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
                  styles.BlockedCountry +
                  " " +
                  (theme === "Dark" ? styles.BlockedCountryDark : "")
                }
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
          <div
            className={
              styles.Head + " " + (theme === "Dark" ? styles.DarkHead : "")
            }
          >
            <div className={styles.HeadText}>
              I have
              <div className={styles.Select}>
                <select>
                  <option value="ARDRIVE">ARDRIVE</option>
                </select>
                <ChevronDownIcon className={styles.Arrow} />
              </div>
            </div>
            <div className={styles.HeadText}>
              I want
              <div className={styles.Select}>
                <select>
                  <option value="VRT">VRT</option>
                </select>
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
