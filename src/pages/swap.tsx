import { UserInterface } from "@verto/js/dist/faces";
import { Button, Page, Select, Spacer, useModal, Modal } from "@verto/ui";
import { useEffect } from "react";
import { permissions as requiredPermissions } from "../utils/arconnect";
import Balance from "../components/Balance";
import Head from "next/head";
import Metas from "../components/Metas";
import useArConnect from "use-arconnect";
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

  return (
    <Page>
      <Head>
        <title>Verto - Swap</title>
        <Metas title="Swap" />
      </Head>
      <Spacer y={3} />
      <Balance />
      <Spacer y={4} />
      <div className={styles.SwapContent}></div>
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
